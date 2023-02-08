const Discord = require('discord.js');
const { QuickDB } = require("quick.db");
const DB = new QuickDB();

module.exports = {
    name: "cadastrar",
    description: "Registre um produto novo.",
    type: Discord.ApplicationCommandType.ChatInput,
    options: [
        {
            name: "identificação",
            description: "Nome do produto a ser registrado.",
            type: 3,
            required: true,
        },
    ],

    run: async (client, interaction) => {
        let Selecionado = interaction.options.getString('identificação');
        let Produto = await DB.get(Selecionado);
        if (Produto) return interaction.reply({ content: 'Produto já existente!', ephemeral: true });

        let Janela = new Discord.ModalBuilder().setCustomId('Cadastro_Modal').setTitle('Formulário de Vendas');
        const PrimeiroActionRow = new Discord.ActionRowBuilder().addComponents(new Discord.TextInputBuilder().setCustomId('Identificação').setLabel("Qual será o ID?").setValue(Selecionado).setStyle(Discord.TextInputStyle.Short).setRequired(true));
        const SegundoActionRow = new Discord.ActionRowBuilder().addComponents(new Discord.TextInputBuilder().setCustomId('Nome').setLabel("Qual será a nome?").setStyle(Discord.TextInputStyle.Paragraph).setRequired(true));
        const TerceiroActionRow = new Discord.ActionRowBuilder().addComponents(new Discord.TextInputBuilder().setCustomId('Valor').setLabel("Qual será o valor?").setStyle(Discord.TextInputStyle.Short).setRequired(true));
        Janela.addComponents(PrimeiroActionRow, SegundoActionRow, TerceiroActionRow);
        return interaction.showModal(Janela);
    }
};