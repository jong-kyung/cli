import type { SerializedOptions } from '@tanstack/create'

import type {
  AddOnInfo,
  DryRunOutput,
  InitialData,
  TemplateInfo,
} from '../types'

// @ts-ignore - import.meta.env is not available in the browser
const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

export async function createAppStreaming(
  options: SerializedOptions,
  chosenAddOns: Array<string>,
  projectTemplate?: TemplateInfo,
) {
  return await fetch(`${baseUrl}/api/create-app`, {
    method: 'POST',
    body: JSON.stringify({
      options: {
        ...options,
        chosenAddOns,
        starter: projectTemplate?.url || undefined,
      },
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function addToAppStreaming(chosenAddOns: Array<string>) {
  return await fetch(`${baseUrl}/api/add-to-app`, {
    method: 'POST',
    body: JSON.stringify({
      addOns: chosenAddOns,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function shutdown() {
  return fetch(`${baseUrl}/api/shutdown`, {
    method: 'POST',
  })
}

export async function loadRemoteAddOn(url: string) {
  const response = await fetch(`${baseUrl}/api/load-remote-add-on?url=${url}`)
  return (await response.json()) as AddOnInfo | { error: string }
}

export async function loadRemoteTemplate(url: string) {
  const response = await fetch(`${baseUrl}/api/load-template?url=${url}`)
  return (await response.json()) as TemplateInfo | { error: string }
}

// Legacy alias
export const loadRemoteStarter = loadRemoteTemplate

const initialDataRequest = fetch(`${baseUrl}/api/initial-payload`)

export async function loadInitialData() {
  const payloadReq = await initialDataRequest
  return (await payloadReq.json()) as InitialData
}

export async function dryRunCreateApp(
  options: SerializedOptions,
  chosenAddOns: Array<string>,
  projectTemplate?: TemplateInfo,
) {
  const outputReq = await fetch(`${baseUrl}/api/dry-run-create-app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      options: {
        ...options,
        chosenAddOns: chosenAddOns,
        starter: projectTemplate?.url,
      },
    }),
  })
  return outputReq.json() as Promise<DryRunOutput>
}

export async function dryRunAddToApp(addOns: Array<string>) {
  const outputReq = await fetch(`${baseUrl}/api/dry-run-add-to-app`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addOns,
    }),
  })
  return outputReq.json() as Promise<DryRunOutput>
}
