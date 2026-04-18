import { schemaTemplate } from "./schema.template.js"
import { providerTemplate } from "./provider.template.js"
import { tableTemplate } from "./table.template.js"
import { columnsTemplate } from "./columns.template.js"
import { dialogsTemplate } from "./dialogs.template.js"
import { createDialogTemplate } from "./create-dialog.template.js"
import { updateDialogTemplate } from "./update-dialog.template.js"
import { createButtonTemplate } from "./create-button.template.js"
import { typesTemplate } from "./types.template.js"
import { formSchemaTemplate } from "./form-schema.template.js"
import { pageTemplate } from "./page.template.js"
import { apiTemplate } from "./api.template.js"
import { routeTemplate } from "./route.template.js"
import { rowActionsTemplate } from "./row-actions.template.js"

export const templates = {
    api: apiTemplate,
    schema: schemaTemplate,
    provider: providerTemplate,
    table: tableTemplate,
    columns: columnsTemplate,
    dialogs: dialogsTemplate,
    createDialog: createDialogTemplate,
    updateDialog: updateDialogTemplate,
    createButton: createButtonTemplate,
    types: typesTemplate,
    formSchema: formSchemaTemplate,
    page: pageTemplate,
    route: routeTemplate,
    rowActions: rowActionsTemplate,
}