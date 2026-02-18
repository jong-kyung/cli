import { resolve } from 'node:path'
import fs from 'node:fs'

import {
  DEFAULT_PACKAGE_MANAGER,
  finalizeAddOns,
  getFrameworkById,
  getPackageManager,
  loadStarter,
  populateAddOnOptionsDefaults,
} from '@tanstack/create'

import {
  getCurrentDirectoryName,
  sanitizePackageName,
  validateProjectName,
} from './utils.js'
import type { Options } from '@tanstack/create'

import type { CliOptions } from './types.js'

const SUPPORTED_LEGACY_TEMPLATES = new Set([
  'file-router',
  'typescript',
  'tsx',
])

export function validateLegacyCreateFlags(cliOptions: CliOptions): {
  warnings: Array<string>
  error?: string
} {
  const warnings: Array<string> = []

  if (cliOptions.routerOnly) {
    warnings.push(
      'The --router-only flag enables router-only compatibility mode. Start-dependent add-ons, deployment adapters, and starters are disabled; only the base template and optional toolchain are supported.',
    )
  }

  if (cliOptions.routerOnly && cliOptions.addOns) {
    warnings.push(
      'Ignoring --add-ons in router-only compatibility mode.',
    )
  }

  if (cliOptions.routerOnly && cliOptions.deployment) {
    warnings.push(
      'Ignoring --deployment in router-only compatibility mode.',
    )
  }

  if (cliOptions.routerOnly && cliOptions.starter) {
    warnings.push('Ignoring --starter in router-only compatibility mode.')
  }

  if (cliOptions.tailwind === true) {
    warnings.push(
      'The --tailwind flag is deprecated and ignored. Tailwind is always enabled in TanStack Start scaffolds.',
    )
  }

  if (cliOptions.tailwind === false) {
    warnings.push(
      'The --no-tailwind flag is deprecated and ignored. Tailwind opt-out is intentionally unsupported to keep add-on permutations maintainable; remove Tailwind after scaffolding if needed.',
    )
  }

  if (!cliOptions.template) {
    return { warnings }
  }

  const template = cliOptions.template.toLowerCase().trim()

  if (template === 'javascript' || template === 'js' || template === 'jsx') {
    return {
      warnings,
      error:
        'JavaScript/JSX templates are not supported. TanStack Start file-router templates are TypeScript-only.',
    }
  }

  if (!SUPPORTED_LEGACY_TEMPLATES.has(template)) {
    return {
      warnings,
      error: `Invalid --template value: ${cliOptions.template}. Supported values are: file-router, typescript, tsx.`,
    }
  }

  warnings.push('The --template flag is deprecated and mapped for compatibility.')

  return { warnings }
}

export async function normalizeOptions(
  cliOptions: CliOptions,
  forcedAddOns?: Array<string>,
  opts?: {
    disableNameCheck?: boolean
    forcedDeployment?: string
  },
): Promise<Options | undefined> {
  let projectName = (cliOptions.projectName ?? '').trim()
  let targetDir: string

  // Handle "." as project name - use current directory
  if (projectName === '.') {
    projectName = sanitizePackageName(getCurrentDirectoryName())
    targetDir = resolve(process.cwd())
  } else {
    targetDir = resolve(process.cwd(), projectName)
  }

  if (!projectName && !opts?.disableNameCheck) {
    return undefined
  }

  if (projectName) {
    const { valid, error } = validateProjectName(projectName)
    if (!valid) {
      console.error(error)
      process.exit(1)
    }
  }

  // Mode is always file-router (TanStack Start)
  let mode = 'file-router'
  let routerOnly = !!cliOptions.routerOnly

  const template = cliOptions.template?.toLowerCase().trim()
  if (template && template !== 'file-router') {
    routerOnly = true
  }

  const starter = !routerOnly && cliOptions.starter
    ? await loadStarter(cliOptions.starter)
    : undefined

  // TypeScript and Tailwind are always enabled with TanStack Start
  const typescript = true
  const tailwind = true

  if (starter) {
    cliOptions.framework = starter.framework
    mode = starter.mode
  }

  const framework = getFrameworkById(cliOptions.framework || 'react-cra')!

  async function selectAddOns() {
    // Edge case for Windows Powershell
    if (Array.isArray(cliOptions.addOns) && cliOptions.addOns.length === 1) {
      const parseSeparatedArgs = cliOptions.addOns[0].split(' ')
      if (parseSeparatedArgs.length > 1) {
        cliOptions.addOns = parseSeparatedArgs
      }
    }

    if (
      Array.isArray(cliOptions.addOns) ||
      starter?.dependsOn ||
      forcedAddOns ||
      cliOptions.toolchain ||
      cliOptions.deployment
    ) {
      const selectedAddOns = new Set<string>([
        ...(routerOnly ? [] : (starter?.dependsOn || [])),
        ...(routerOnly ? [] : (forcedAddOns || [])),
      ])
      if (!routerOnly && cliOptions.addOns && Array.isArray(cliOptions.addOns)) {
        for (const a of cliOptions.addOns) {
          if (a.toLowerCase() === 'start') {
            continue
          }
          selectedAddOns.add(a)
        }
      }
      if (cliOptions.toolchain) {
        selectedAddOns.add(cliOptions.toolchain)
      }
      if (!routerOnly && cliOptions.deployment) {
        selectedAddOns.add(cliOptions.deployment)
      }

      if (!routerOnly && !cliOptions.deployment && opts?.forcedDeployment) {
        selectedAddOns.add(opts.forcedDeployment)
      }

      return await finalizeAddOns(framework, mode, Array.from(selectedAddOns))
    }

    return []
  }

  const includeExamples = cliOptions.examples ?? !routerOnly
  const chosenAddOnsRaw = await selectAddOns()
  const chosenAddOns = includeExamples
    ? chosenAddOnsRaw
    : chosenAddOnsRaw.filter((addOn) => addOn.type !== 'example')

  // Handle add-on configuration option
  let addOnOptionsFromCLI = {}
  if (cliOptions.addOnConfig) {
    try {
      addOnOptionsFromCLI = JSON.parse(cliOptions.addOnConfig)
    } catch (error) {
      console.error('Error parsing add-on config:', error)
      process.exit(1)
    }
  }

  const normalized = {
    projectName: projectName,
    targetDir,
    framework,
    mode,
    typescript,
    tailwind,
    packageManager:
      cliOptions.packageManager ||
      getPackageManager() ||
      DEFAULT_PACKAGE_MANAGER,
    git: cliOptions.git ?? true,
    install: cliOptions.install,
    chosenAddOns,
    addOnOptions: {
      ...populateAddOnOptionsDefaults(chosenAddOns),
      ...addOnOptionsFromCLI,
    },
    starter: starter,
  }

  ;(normalized as Options & { includeExamples?: boolean }).includeExamples =
    includeExamples
  ;(normalized as Options & { envVarValues?: Record<string, string> }).envVarValues =
    {}

  return normalized
}

export function validateDevWatchOptions(cliOptions: CliOptions): {
  valid: boolean
  error?: string
} {
  if (!cliOptions.devWatch) {
    return { valid: true }
  }

  // Validate watch path exists
  const watchPath = resolve(process.cwd(), cliOptions.devWatch)
  if (!fs.existsSync(watchPath)) {
    return {
      valid: false,
      error: `Watch path does not exist: ${watchPath}`,
    }
  }

  // Validate it's a directory
  const stats = fs.statSync(watchPath)
  if (!stats.isDirectory()) {
    return {
      valid: false,
      error: `Watch path is not a directory: ${watchPath}`,
    }
  }

  // Ensure target directory is specified
  if (!cliOptions.projectName && !cliOptions.targetDir) {
    return {
      valid: false,
      error: 'Project name or target directory is required for dev watch mode',
    }
  }

  // Check for framework structure
  const hasAddOns = fs.existsSync(resolve(watchPath, 'add-ons'))
  const hasAssets = fs.existsSync(resolve(watchPath, 'assets'))
  const hasFrameworkJson = fs.existsSync(resolve(watchPath, 'framework.json'))

  if (!hasAddOns && !hasAssets && !hasFrameworkJson) {
    return {
      valid: false,
      error: `Watch path does not appear to be a valid framework directory: ${watchPath}`,
    }
  }

  return { valid: true }
}
