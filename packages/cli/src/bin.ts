#!/usr/bin/env node
import { cli } from './cli.js'
import {
  createReactFrameworkDefinition,
  createSolidFrameworkDefinition,
} from '@tanstack/create'

cli({
  name: 'tanstack',
  appName: 'TanStack',
  frameworkDefinitionInitializers: [
    createReactFrameworkDefinition,
    createSolidFrameworkDefinition,
  ],
})
