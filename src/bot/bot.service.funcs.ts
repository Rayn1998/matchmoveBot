import TelegramBot from "node-telegram-bot-api";
import { MatchmoveBot } from "./bot.service";
import { filePath } from "../constant";
import { promises as fs } from "fs";

export const startFunc = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;

    const isAdmin = msg.chat.username === "bodolanov";

    const keyboard = isAdmin
        ? {
              reply_markup: {
                  keyboard: [
                      [
                          {
                              text: "Запрос на трек",
                          },
                          {
                              text: "Посмотреть запросы",
                          },
                          {
                              text: "Удалить все сохранённые запросы",
                          },
                      ],
                  ],
                  resize_keyboard: true,
                  one_time_keyboard: true,
              },
          }
        : {
              reply_markup: {
                  keyboard: [
                      [
                          {
                              text: "Запрос на трек",
                          },
                      ],
                  ],
                  resize_keyboard: true,
                  one_time_keyboard: true,
              },
          };

    await bot.sendMessage(
        chatId,
        `Привет, ${msg.chat.first_name}! Если ты обратился ко мне для заказа шота на трек! Пожалуйста, ответь на пару вопросов, нажав кнопку "Запрос на трек". Это 20 секунд, но сильно упростит и ускорит нашу коммуникацию`,
        keyboard,
    );
};

export const matchmoveRequestFunc = async (
    bot: MatchmoveBot,
    msg: TelegramBot.Message,
) => {
    const chatId = msg.chat.id;
    const request = bot.userRequests.get(chatId);

    if (!request) return;
    if (msg.text === "Запрос на трек") return;

    switch (request.step) {
        case 1:
            request.shotsAmount = msg.text;
            request.step = 2;
            await bot.sendMessage(chatId, "Укажите желаемый срок выполнения");
            break;

        case 2:
            request.deadline = msg.text;
            request.step = 3;
            await bot.sendMessage(chatId, "Добавьте ссылку на превью шотов");
            break;

        case 3:
            request.previewLink = msg.text;
            request.contact = msg.chat.username;
            request.step = 4;

            await bot.sendMessage(
                chatId,
                `Ваш запрос: \nКоличество шотов: ${request.shotsAmount}\nСрок выполнения: ${request.deadline}\nСсылка на превью шотов: ${request.previewLink}`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Да, верно",
                                    callback_data: "confirmed_request",
                                },
                                {
                                    text: "Нет, заново",
                                    callback_data: "restart_request",
                                },
                                {
                                    text: "Нет, отмена",
                                    callback_data: "request_cancelation",
                                },
                            ],
                        ],
                        resize_keyboard: true,
                    },
                },
            );
            break;

        default:
            await bot.sendMessage(
                chatId,
                "Произошла ошибка. Попробуйте снова.",
            );
    }
};

export const queryHanlderFunc = async (
    bot: MatchmoveBot,
    query: TelegramBot.CallbackQuery,
) => {
    const data = query.data;
    const chatId = query.message?.chat.id;

    if (!data || !chatId) return;

    if (data === "confirmed_request" && chatId) {
        const confirmedRequest = bot.userRequests.get(chatId);
        if (confirmedRequest?.step === 4) {
            const json = await fs
                .readFile(filePath, "utf-8")
                .then((file) => file)
                .catch(() => {
                    const json = fs.writeFile(filePath, "");
                    return json;
                });

            let parsedJson = [];
            if (json) {
                parsedJson = JSON.parse(json);
            }

            parsedJson.push({
                amountOfShots: confirmedRequest?.shotsAmount,
                deadline: confirmedRequest?.deadline,
                preview: confirmedRequest?.previewLink,
                contact: confirmedRequest?.contact,
            });

            await fs.writeFile(filePath, JSON.stringify(parsedJson));
        } else {
            await bot.sendMessage(
                chatId,
                "Произошла ошибка подтверждения запроса, пожалуйста, сформируйте его заново",
            );
            return;
        }

        bot.userRequests.deleteRequest(chatId);

        await bot.sendMessage(
            chatId,
            "Отлично, я с вами свяжусь для дальнейшего обсуждения. Спасибо!",
        );
    }

    if (data === "restart_request") {
        if (!bot.userRequests.get(chatId)) {
            await bot.sendMessage(
                chatId,
                `Нет незавершенного запроса. Пожалуйста, сформируйте новый, нажав "Запрос на трек"`,
            );
            return;
        }
        bot.userRequests.deleteRequest(chatId);
        await bot.userRequests.createRequest(bot, chatId);
    }

    if (data === "request_cancelation") {
        bot.userRequests.deleteRequest(chatId);
        await bot.sendMessage(chatId, "Запрос отменён");
    }
};

export const getRequestsFunc = async (
    bot: MatchmoveBot,
    msg: TelegramBot.Message,
) => {
    const chatId = msg.chat.id;
    const json = await fs.readFile(filePath, "utf-8").then((file) => file);

    let parsedJson = [];
    parsedJson = JSON.parse(json);
    if (parsedJson.length === 0) {
        await bot.sendMessage(chatId, "Запросов пока нет");
        return;
    }

    await bot.sendMessage(
        chatId,
        `Общее количесвто запросов: ${parsedJson.length}`,
    );

    for (const request of parsedJson) {
        await bot.sendMessage(
            chatId,
            `Количество шотов: ${request.amountOfShots}\nСрок выполнения: ${request.deadline}\nСсылка: ${request.preview}\nКонтакт: @${request.contact}`,
        );
    }
};

export const clearRequestsFunc = async (
    bot: MatchmoveBot,
    msg: TelegramBot.Message,
) => {
    const chatId = msg.chat.id;

    try {
        await fs.writeFile(filePath, "[]", "utf-8");
        await bot.sendMessage(chatId, "Все запросы были удалены.");
    } catch (err) {
        await bot.sendMessage(
            chatId,
            "Произошла ошибка удаления запросов, попробуйте заново",
        );
    }
};
