#!/usr/bin/env node

import { generateCrud } from "./generator.js"

const entity = process.argv[2]

if (!entity) {
    console.error("❌ Missing entity name")
    process.exit(1)
}

generateCrud(entity)