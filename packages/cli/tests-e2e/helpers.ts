import { spawn } from 'node:child_process'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const cliDistPath = resolve(repoRoot, 'packages/cli/dist/index.js')

export type E2EApp = {
  rootDir: string
  appDir: string
  url: string
  framework: 'react' | 'solid'
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun' | 'deno'
  stop: () => Promise<void>
  cleanup: () => Promise<void>
}

type CreateAppFixtureOptions = {
  appName: string
  framework?: 'react' | 'solid'
  packageManager?: 'pnpm' | 'npm' | 'yarn' | 'bun' | 'deno'
  routerOnly?: boolean
  template?: string
  addOns?: Array<string>
  postCreateAddOns?: Array<string>
  skipDevServer?: boolean
}

export type RuntimeGuards = {
  assertClean: () => void
  dispose: () => void
}

function runCommand(
  command: string,
  args: Array<string>,
  opts: {
    cwd: string
    env?: NodeJS.ProcessEnv
  },
) {
  return new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: opts.cwd,
      env: {
        ...process.env,
        ...opts.env,
      },
      stdio: 'pipe',
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    child.on('error', (err) => {
      rejectPromise(err)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }
      rejectPromise(
        new Error(
          `${command} ${args.join(' ')} failed with code ${code}\n` +
            `stdout:\n${stdout}\n\n` +
            `stderr:\n${stderr}`,
        ),
      )
    })
  })
}

function waitForServer(url: string, timeoutMs = 90_000) {
  const started = Date.now()
  return new Promise<void>((resolvePromise, rejectPromise) => {
    const attempt = async () => {
      try {
        const response = await fetch(url)
        if (response.ok) {
          resolvePromise()
          return
        }
      } catch {
        // keep waiting
      }

      if (Date.now() - started > timeoutMs) {
        rejectPromise(new Error(`Timed out waiting for server: ${url}`))
        return
      }

      setTimeout(attempt, 500)
    }

    void attempt()
  })
}

function stripAnsi(value: string) {
  return value.replace(/\u001b\[[0-9;]*m/g, '')
}

function waitForDevServerURL(getStdout: () => string, timeoutMs = 90_000) {
  const started = Date.now()

  return new Promise<string>((resolvePromise, rejectPromise) => {
    const attempt = () => {
      const stdout = stripAnsi(getStdout())
      const match = stdout.match(/Local:\s+(https?:\/\/[^\s]+)/)
      if (match?.[1]) {
        resolvePromise(match[1].replace(/\/$/, ''))
        return
      }

      if (Date.now() - started > timeoutMs) {
        rejectPromise(new Error('Timed out waiting for dev server URL in output'))
        return
      }

      setTimeout(attempt, 250)
    }

    attempt()
  })
}

async function stopChild(child: ReturnType<typeof spawn>) {
  if (child.killed || child.exitCode !== null) {
    return
  }

  const killTree = (signal: NodeJS.Signals) => {
    if (typeof child.pid === 'number') {
      try {
        process.kill(-child.pid, signal)
        return
      } catch {
        // fall through to direct child kill
      }
    }
    child.kill(signal)
  }

  killTree('SIGTERM')

  await new Promise<void>((resolvePromise) => {
    const timer = setTimeout(() => {
      if (!child.killed && child.exitCode === null) {
        killTree('SIGKILL')
      }
      resolvePromise()
    }, 5_000)

    child.once('close', () => {
      clearTimeout(timer)
      resolvePromise()
    })
  })
}

async function patchViteConfigForE2E(appDir: string) {
  const viteConfigPath = join(appDir, 'vite.config.ts')

  let viteConfig = ''
  try {
    viteConfig = await readFile(viteConfigPath, 'utf8')
  } catch {
    return
  }

  const next = viteConfig.replace(
    'devtools(),',
    'devtools({ eventBusConfig: { enabled: false } }),',
  )

  if (next !== viteConfig) {
    await writeFile(viteConfigPath, next)
  }
}

export function getRepoPath(...segments: Array<string>) {
  return resolve(repoRoot, ...segments)
}

export async function createReactAppFixture(
  options: Omit<CreateAppFixtureOptions, 'framework'>,
): Promise<E2EApp> {
  return createAppFixture({
    framework: 'react',
    ...options,
  })
}

function getPackageManagerCommandForScript(
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun' | 'deno',
  script: 'dev' | 'build',
) {
  switch (packageManager) {
    case 'npm':
      return {
        command: 'npm',
        args: ['run', script],
      }
    case 'pnpm':
      return {
        command: 'pnpm',
        args: [script],
      }
    case 'yarn':
      return {
        command: 'yarn',
        args: [script],
      }
    case 'bun':
      return {
        command: 'bun',
        args: ['run', script],
      }
    case 'deno':
      return {
        command: 'deno',
        args: ['task', script],
      }
  }
}

function getPackageManagerTypecheckCommand(
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun' | 'deno',
) {
  switch (packageManager) {
    case 'npm':
      return {
        command: 'npm',
        args: ['exec', '--', 'tsc', '--noEmit'],
      }
    case 'pnpm':
      return {
        command: 'pnpm',
        args: ['exec', 'tsc', '--noEmit'],
      }
    case 'yarn':
      return {
        command: 'yarn',
        args: ['exec', 'tsc', '--noEmit'],
      }
    case 'bun':
      return {
        command: 'bun',
        args: ['x', 'tsc', '--noEmit'],
      }
    case 'deno':
      return {
        command: 'deno',
        args: ['task', 'typecheck'],
      }
  }
}

async function runQualityGates(
  appDir: string,
  packageManager: 'pnpm' | 'npm' | 'yarn' | 'bun' | 'deno',
) {
  const build = getPackageManagerCommandForScript(packageManager, 'build')
  await runCommand(build.command, build.args, {
    cwd: appDir,
    env: {
      CI: '1',
    },
  })

  const typecheck = getPackageManagerTypecheckCommand(packageManager)
  await runCommand(typecheck.command, typecheck.args, {
    cwd: appDir,
    env: {
      CI: '1',
    },
  })
}

export async function createAppFixture(
  options: CreateAppFixtureOptions,
): Promise<E2EApp> {
  await access(cliDistPath)

  const rootDir = await mkdtemp(join(tmpdir(), 'tanstack-cli-e2e-'))
  const {
    appName,
    template,
    addOns,
    postCreateAddOns,
    skipDevServer,
    framework = 'react',
    packageManager = 'pnpm',
    routerOnly = false,
  } = options
  const appDir = join(rootDir, appName)

  const createArgs = [
    cliDistPath,
    'create',
    appName,
    '--framework',
    framework,
    '--package-manager',
    packageManager,
    '--no-git',
  ]

  if (routerOnly) {
    createArgs.push('--router-only')
  }

  if (template) {
    createArgs.push('--template', template)
  }

  if (addOns?.length) {
    createArgs.push('--add-ons', addOns.join(','))
  }

  await runCommand(
    'node',
    createArgs,
    {
      cwd: rootDir,
      env: {
        CI: '1',
      },
    },
  )

  await patchViteConfigForE2E(appDir)

  if (postCreateAddOns?.length) {
    await runCommand('node', [cliDistPath, 'add', ...postCreateAddOns], {
      cwd: appDir,
      env: {
        CI: '1',
      },
    })

    await patchViteConfigForE2E(appDir)
  }

  await runQualityGates(appDir, packageManager)

  if (skipDevServer) {
    return {
      rootDir,
      appDir,
      url: '',
      framework,
      packageManager,
      stop: async () => {},
      cleanup: async () => {
        await rm(rootDir, { recursive: true, force: true })
      },
    }
  }

  const dev = getPackageManagerCommandForScript(packageManager, 'dev')

  const server = spawn(dev.command, dev.args, {
    cwd: appDir,
    env: {
      ...process.env,
      CI: '1',
    },
    stdio: 'pipe',
    detached: true,
  })

  let serverStdout = ''
  server.stdout.on('data', (chunk) => {
    serverStdout += String(chunk)
  })

  let serverStderr = ''
  server.stderr.on('data', (chunk) => {
    serverStderr += String(chunk)
  })

  let url = 'http://localhost:3000'
  try {
    url = await waitForDevServerURL(() => serverStdout)
    await waitForServer(url)
  } catch (error) {
    await stopChild(server)
    throw new Error(
      `Failed to start app server at ${url}\nstdout:\n${serverStdout}\n\nstderr:\n${serverStderr}\n\n${error}`,
    )
  }

  return {
    rootDir,
    appDir,
    url,
    framework,
    packageManager,
    stop: async () => {
      await stopChild(server)
    },
    cleanup: async () => {
      await rm(rootDir, { recursive: true, force: true })
    },
  }
}

function toSameOrigin(url: string, appOrigin: URL) {
  try {
    const parsed = new URL(url)
    return parsed.origin === appOrigin.origin
  } catch {
    return false
  }
}

export function attachRuntimeGuards(page: Page, appUrl: string): RuntimeGuards {
  const appOrigin = new URL(appUrl)
  const pageErrors: Array<string> = []
  const consoleErrors: Array<string> = []
  const requestFailures: Array<string> = []
  const httpErrors: Array<string> = []

  const onPageError = (error: Error) => {
    pageErrors.push(error.message)
  }

  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  }

  const onRequestFailed = (request: {
    method: () => string
    url: () => string
    failure: () => { errorText?: string } | null
  }) => {
    const url = request.url()
    if (!toSameOrigin(url, appOrigin)) {
      return
    }
    const errorText = request.failure()?.errorText || 'unknown error'

    if (errorText.includes('ERR_ABORTED')) {
      return
    }

    requestFailures.push(`${request.method()} ${url} :: ${errorText}`)
  }

  const onResponse = (response: {
    url: () => string
    status: () => number
    request: () => { method: () => string }
  }) => {
    const url = response.url()
    if (!toSameOrigin(url, appOrigin)) {
      return
    }

    const status = response.status()
    if (status >= 400) {
      httpErrors.push(`${response.request().method()} ${status} ${url}`)
    }
  }

  page.on('pageerror', onPageError)
  page.on('console', onConsole)
  page.on('requestfailed', onRequestFailed)
  page.on('response', onResponse)

  return {
    assertClean: () => {
      if (
        pageErrors.length === 0 &&
        consoleErrors.length === 0 &&
        requestFailures.length === 0 &&
        httpErrors.length === 0
      ) {
        return
      }

      throw new Error(
        [
          'Runtime errors detected in browser session:',
          pageErrors.length
            ? `pageerror:\n${pageErrors.map((line) => `- ${line}`).join('\n')}`
            : '',
          consoleErrors.length
            ? `console.error:\n${consoleErrors.map((line) => `- ${line}`).join('\n')}`
            : '',
          requestFailures.length
            ? `requestfailed:\n${requestFailures.map((line) => `- ${line}`).join('\n')}`
            : '',
          httpErrors.length
            ? `http >= 400:\n${httpErrors.map((line) => `- ${line}`).join('\n')}`
            : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      )
    },
    dispose: () => {
      page.off('pageerror', onPageError)
      page.off('console', onConsole)
      page.off('requestfailed', onRequestFailed)
      page.off('response', onResponse)
    },
  }
}
