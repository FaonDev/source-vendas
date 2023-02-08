const Discord = require('discord.js');
const { QuickDB } = require("quick.db");
const DB = new QuickDB();

module.exports = {
    name: "deletar",
    description: "Delete um produto existente.",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: "identificação",
            description: "ID do produto existente.",
            type: 3,
            required: true,
        },
    ],

    run: async (client, interaction) => {
        let ID = interaction.options.getString('identificação');
        let Produto = await DB.get(ID);
        if (!Produto) return interaction.reply({ content: 'Produto inexistente!', ephemeral: true });

        await DB.delete(ID).then(() => {
            return interaction.reply({ content: 'Produto deletado com sucesso!', ephemeral: true });
        });
    }
};