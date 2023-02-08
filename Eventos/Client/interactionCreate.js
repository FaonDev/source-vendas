const Discord = require('discord.js');
const Client = require('../../index');
const Config = require('../../config.json');
const String = require('randomstring');
const { PIX } = require('gpix/dist');
const Canvas = require('canvas');
const { QuickDB } = require("quick.db");
const DB = new QuickDB();

async function QRCode(price, description) {
    let Pix = PIX.static().setReceiverName(Client.user.username).setReceiverCity('Brasil').setKey(Config.chave_pix).setDescription(description).setAmount(price);
    const Imagem = Canvas.createCanvas(1024, 1024);
    const Contexto = Imagem.getContext('2d');
    let A = await Canvas.loadImage(await Pix.getQRCode());
    Contexto.fillStyle = '#8265f8';
    Contexto.fillRect(0, 0, Imagem.width, Imagem.height);
    Contexto.drawImage(A, 54.5, 54.5, 915, 915);
    return Imagem;
};

async function Copia_Cola(price, description) {
    let Pix = PIX.static().setReceiverName(Client.user.username).setReceiverCity('Brasil').setKey(Config.chave_pix).setDescription(description).setAmount(price);
    return Pix.getBRCode();
};

Client.on("interactionCreate", async interaction => {
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'Cadastro_Modal') {
            let ID = interaction.fields.getTextInputValue('Identificação');
            let Name = interaction.fields.getTextInputValue('Nome');
            let Price = parseInt(interaction.fields.getTextInputValue('Valor'));
            if (!Price) return interaction.reply({ content: "Valor inválido!", ephemeral: true });

            await DB.set(ID, { "Nome": Name, "Valor": Price });
            console.log(await DB.get(ID));

            return interaction.reply({ content: "Item cadastrado com sucesso!", ephemeral: true });
        };
    };

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'Seletor_Menu') {
            let Selecionado = interaction.values[0];

            let Produto = await DB.get(Selecionado);
            if (!Produto) return interaction.reply({ content: 'Produto inexistente!', ephemeral: true });

            let Embed = new Discord.EmbedBuilder().setDescription(`\`\`\`fix\n[${Produto.Valor} BRL] ${Produto.Nome.toUpperCase()}\n\`\`\``).setColor('Random').setImage('https://i.imgur.com/3Pc1mqI.png').setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() });

            let Menu = new Discord.ActionRowBuilder().addComponents(new Discord.StringSelectMenuBuilder().setCustomId('Compras_Menu').setPlaceholder('Clique para selecionar uma opção.').addOptions(
                { label: `[PIX] Compra rápida`, emoji: "⚡", value: `Comprar_${Selecionado}` },
                { label: `Adicionar ao carrinho`, emoji: "🛒", value: `Carrinho_${Selecionado}` }
            ));

            return interaction.reply({ embeds: [Embed], components: [Menu] });
        };

        if (interaction.customId === 'Compras_Menu') {
            let Selecionado = interaction.values[0];
            if (Selecionado.startsWith('Comprar_')) {
                let ID = Selecionado.replace("Comprar_", "");
                let Produto = await DB.get(ID);
                let BRCode = await Copia_Cola(Produto.Valor, interaction.user.tag);

                QRCode(Produto.Valor, interaction.user.tag).then(async (Imagem) => {
                    let Embed = new Discord.EmbedBuilder().setColor('Random').setDescription(`\`\`\`JS\n${BRCode}\n\`\`\``);
                    return interaction.reply({ embeds: [Embed], files: [{ attachment: Imagem.toBuffer(), name: "SPOILER_QRCODE.png" }], ephemeral: true });
                });
            };

            if (Selecionado.startsWith('Carrinho_')) {
                if (interaction.guild.channels.cache.find(channel => channel.name === `carrinho-${interaction.user.username.toLowerCase()}`)) return interaction.reply({ content: "Você já possui um carrinho aberto.", ephemeral: true });
                await interaction.deferReply({ ephemeral: true });

                let ID = Selecionado.replace("Carrinho_", "");
                let Produto = await DB.get(ID);
                interaction.guild.channels.create({
                    name: `carrinho-${interaction.user.username.toLowerCase()}`,
                    parent: Config.categoria_carrinhos,
                    type: Discord.ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: ['ViewChannel']
                        },
                        {
                            id: interaction.user.id,
                            allow: ['ViewChannel'],
                            deny: ['SendMessages']
                        }
                    ]
                }).then(async Canal => {
                    let Embed = new Discord.EmbedBuilder().setThumbnail('https://i.imgur.com/uZWxc5V.jpg').setColor('Random').setAuthor({ name: `Adquirindo "${Produto.Nome.toUpperCase()}"`, iconURL: interaction.user.displayAvatarURL() }).addFields(
                        {
                            name: 'Quantidade',
                            value: `${1}`,
                            inline: true
                        },
                        {
                            name: 'Valor (em reais)',
                            value: `${Produto.Valor} BRL`,
                            inline: true
                        },
                        {
                            name: 'Referência',
                            value: `${String.generate({ length: 30, charset: 'alphabetic' }).toUpperCase()}_${String.generate({ length: 10, charset: 'numeric' })}`,
                            inline: false
                        }
                    );

                    let Seletor = new Discord.ActionRowBuilder().addComponents(new Discord.StringSelectMenuBuilder().setCustomId('Seletor_Compra').setPlaceholder('Clique para selecionar uma opção.').addOptions(
                        {
                            label: "[PIX] Continuar compra",
                            emoji: "➡️",
                            value: "Continuar"
                        },
                        {
                            label: "Fechar carrinho",
                            emoji: "🔒",
                            value: "Cancelar"
                        }
                    ));

                    let Button = new Discord.ActionRowBuilder().addComponents(
                        new Discord.ButtonBuilder()
                            .setStyle(Discord.ButtonStyle.Primary)
                            .setEmoji('➕')
                            .setCustomId(`Adicionar_${ID}`),
                        new Discord.ButtonBuilder()
                            .setStyle(Discord.ButtonStyle.Secondary)
                            .setEmoji('➖')
                            .setCustomId(`Remover_${ID}`)
                    );

                    return Canal.send({ content: `${interaction.user}`, embeds: [Embed], components: [Seletor, Button] }).then(message => {
                        Button = new Discord.ActionRowBuilder().addComponents(
                            new Discord.ButtonBuilder()
                                .setStyle(Discord.ButtonStyle.Link)
                                .setLabel('Atalho canal')
                                .setURL(message.url)
                        );

                        interaction.editReply({ content: `Carrinho aberto com sucesso!`, components: [Button], ephemeral: true });
                        return message.pin();
                    })
                });
            };
        };

        if (interaction.customId === 'Seletor_Compra') {
            let Selecionado = interaction.values[0];

            if (Selecionado === 'Continuar') {
                let Valor = parseInt(interaction.message.embeds[0].data.fields[1].value);
                let BRCode = await Copia_Cola(Valor, interaction.user.tag);

                QRCode(Valor, interaction.user.tag).then(async (Imagem) => {
                    let Embed = new Discord.EmbedBuilder().setColor('Random').setDescription(`\`\`\`JS\n${BRCode}\n\`\`\``);
                    return interaction.reply({ embeds: [Embed], files: [{ attachment: Imagem.toBuffer(), name: "SPOILER_QRCODE.png" }], ephemeral: true });
                });
            };

            if (Selecionado === 'Cancelar') {
                interaction.deferUpdate();
                setTimeout(() => {
                    interaction.channel.delete();
                }, 5000);
            };
        };
    };

    if (interaction.isButton()) {
        if (interaction.customId.startsWith('Adicionar_')) {
            if (parseInt(interaction.message.embeds[0].data.fields[0].value) >= 10) return interaction.reply({ content: "Você não pode adicionar mais deste produto.", ephemeral: true });
            let Produto = await DB.get(interaction.customId.replace("Adicionar_", ""));

            let Embed = new Discord.EmbedBuilder().setThumbnail('https://i.imgur.com/uZWxc5V.jpg').setColor('Random').setAuthor({ name: `Adquirindo "${Produto.Nome.toUpperCase()}"`, iconURL: interaction.user.displayAvatarURL() }).addFields(
                {
                    name: 'Quantidade',
                    value: `${parseInt(interaction.message.embeds[0].data.fields[0].value) + 1}`,
                    inline: true
                },
                {
                    name: 'Valor (em reais)',
                    value: `${parseInt(interaction.message.embeds[0].data.fields[1].value) + Produto.Valor} BRL`,
                    inline: true
                },
                {
                    name: 'Referência',
                    value: `${String.generate({ length: 30, charset: 'alphabetic' }).toUpperCase()}_${String.generate({ length: 10, charset: 'numeric' })}`,
                    inline: false
                }
            );

            return interaction.update({ embeds: [Embed] });
        };

        if (interaction.customId.startsWith('Remover_')) {
            if (parseInt(interaction.message.embeds[0].data.fields[0].value) <= 1) return interaction.reply({ content: "Você não pode remover mais deste produto.", ephemeral: true });
            let Produto = await DB.get(interaction.customId.replace("Remover_", ""));

            let Embed = new Discord.EmbedBuilder().setThumbnail('https://i.imgur.com/uZWxc5V.jpg').setColor('Random').setAuthor({ name: `Adquirindo "${Produto.Nome.toUpperCase()}"`, iconURL: interaction.user.displayAvatarURL() }).addFields(
                {
                    name: 'Quantidade',
                    value: `${parseInt(interaction.message.embeds[0].data.fields[0].value) - 1}`,
                    inline: true
                },
                {
                    name: 'Valor (em reais)',
                    value: `${parseInt(interaction.message.embeds[0].data.fields[1].value) - Produto.Valor} BRL`,
                    inline: true
                },
                {
                    name: 'Referência',
                    value: `${String.generate({ length: 30, charset: 'alphabetic' }).toUpperCase()}_${String.generate({ length: 10, charset: 'numeric' })}`,
                    inline: false
                }
            );

            return interaction.update({ embeds: [Embed] });
        };
    };
});