const Discord = require('discord.js');
const { QuickDB } = require("quick.db");
const DB = new QuickDB();

module.exports = {
    name: "definir",
    description: "Define um produto existente.",
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        let Vez = 0;
        let Seletor = new Discord.ActionRowBuilder().addComponents(new Discord.StringSelectMenuBuilder().setCustomId('Seletor_Menu').setPlaceholder('Clique para selecionar uma opção.'));

        let Itens = await DB.all();
        if (Itens.length < 1) return interaction.reply({ content: "Nenhum produto foi cadastrado.", ephemeral: true });
        Itens.forEach(response => {
            Seletor.components[0].addOptions(
                {
                    label: `[ID: ${response.id}] ${response.value.Nome}`,
                    value: `${response.id}`
                }
            );
            Vez++
        });

        return interaction.reply({ content: "Selecione o produto na qual será exibido.", components: [Seletor], ephemeral: true });
    }
};