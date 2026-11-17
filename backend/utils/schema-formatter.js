export function formatSchemaForAI(schema) {

    const tableDescriptions = schema.tables.map((table) => {

        const columns = table.columns.map((column) => {

            let description = `${column.name} ${column.columnType}`;

            if (column.isPrimaryKey) {
                description += " PRIMARY KEY";
            }

            if (column.foreignKey) {
                description +=
                    ` FOREIGN KEY REFERENCES ` +
                    `${column.foreignKey.referencedTable}` +
                    `(${column.foreignKey.referencedColumn})`;
            }

            if (!column.nullable) {
                description += " NOT NULL";
            }

            return description;

        });

        return `TABLE ${table.tableName}:\n` +
            columns.map((column) => `- ${column}`).join("\n");

    });

    return [
        `DATABASE: ${schema.database}`,
        "",
        ...tableDescriptions,
    ].join("\n\n");
}
