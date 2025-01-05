import TelegramBot from "node-telegram-bot-api";
import { Requests } from "../requests/requests.service";

export interface IMatchmoveBot {
    bot: TelegramBot;
    userRequests: Requests;
}
