import path from "path"
import fs from "fs"
import { templates } from "./templates/index.js"
import { toPascalCase } from "./utils.js"

export function generateCrud(name) {
    const entity = name.toLowerCase()     // giữ nguyên (dùng cho path)
    const Entity = toPascalCase(entity)   // dùng cho class/component
    const plural = entity + "s"

    const baseDir = path.resolve(`src/features/${entity}`)

    function write(file, content) {
        const filePath = path.join(baseDir, file)
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        fs.writeFileSync(filePath, content)
        console.log("✅", filePath)
    }

    function writeRoot(filePath, content) {
        const fullPath = path.resolve(filePath)
        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, content)
        console.log("✅", fullPath)
    }

    writeRoot(
        `src/api/${entity}.ts`,
        templates.api({ Entity, entity, plural })
    )

    write("data/schema.ts", templates.schema({ Entity }))
    write("components/" + plural + "-provider.tsx", templates.provider({ Entity }))
    write("components/" + entity + "-table.tsx", templates.table({ Entity, entity }))
    write("components/" + entity + "-columns.tsx", templates.columns({ Entity }))
    write("components/" + entity + "-dialogs.tsx", templates.dialogs({ Entity }))
    write(
        "components/" + entity + "-row-actions.tsx",
        templates.rowActions({ Entity, entity })
    )
    write("components/create-" + entity + "-dialog.tsx", templates.createDialog({ Entity }))
    write("components/update-" + entity + "-dialog.tsx", templates.updateDialog({ Entity }))
    write("components/create-" + entity + "-button.tsx", templates.createButton({ Entity }))
    write("components/types.ts", templates.types({ Entity }))
    write("components/" + entity + "-form-schema.ts", templates.formSchema({ Entity }))
    write("index.tsx", templates.page({ Entity, entity }))
    writeRoot(
        `src/routes/_authenticated/${entity}/${entity}.tsx`,
        templates.route({ Entity, entity })
    )
}

