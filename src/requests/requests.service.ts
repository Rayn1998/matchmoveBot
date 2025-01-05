import { IRequest } from "./requests.interface";
import { MatchmoveBot } from "../bot/bot.service";

export class Requests {
    private _requests: Map<number, IRequest>;

    constructor() {
        this._requests = new Map();
    }

    get(chatId: number) {
        return this._requests.get(chatId);
    }

    async deleteRequest(chatId: number) {
        this._requests.delete(chatId);
    }

    async createRequest(bot: MatchmoveBot, chatId: number) {
        if (this._requests.get(chatId)) {
            await bot.sendMessage(
                chatId,
                `Вы уже начали формировать запрос, продолжите его, ответив на вопрос выше или отмените, нажав кнопку "Отмена"`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Отмена",
                                    callback_data: "request_cancelation",
                                },
                            ],
                        ],
                    },
                },
            );
            return;
        }
        this._requests.set(chatId, { step: 1 });
        await bot.sendMessage(
            chatId,
            "Пожалуйста, напиши количество шотов, для которых нужен трек",
        );
    }
}
