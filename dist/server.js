"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongodb_1 = require("mongodb");
const MONGO_URI = "mongodb+srv://devtgmsg:bldMyDr3amZ@cluster0.y3hfx1m.mongodb.net/";
const client = new mongodb_1.MongoClient(MONGO_URI);
const convertShorthandToNumber = (shorthand) => {
    const suffixes = {
        'K': 1000,
        'M': 1000000,
        'B': 1000000000
    };
    const num = parseFloat(shorthand);
    if (isNaN(num)) {
        throw new Error('Invalid number format');
    }
    const suffix = shorthand.toUpperCase().slice(-1);
    const multiplier = suffixes[suffix] || 1;
    const fullNumber = num * multiplier;
    return fullNumber.toLocaleString();
};
const convertHoldersToFomarts = (holders) => {
    const data = holders.split("|");
    let bHolders = [];
    data.map((each, index) => {
        if (each !== '') {
            let keyname = "Holder" + (index);
            let obj = {};
            obj[keyname] = (each.trim());
            bHolders.push(obj);
        }
    });
    return bHolders;
};
const convertHoldersToFomarts1 = (holders) => {
    let bHolders = [];
    holders.map((each, index) => {
        if (each !== '') {
            let keyname = "Holder" + (index);
            let obj = {};
            obj[keyname] = each;
            bHolders.push(obj);
        }
    });
    return bHolders;
};
const convertPriceChangesToFomarts = (prices) => {
    const data = prices.split("|");
    let bPrices = [];
    if (data.length > 0) {
        data.map((_data) => {
            let each = _data.split(":");
            let obj = {};
            obj[each[0].trim()] = each[1].trim().includes("%") ? each[1].trim().replace("%", "") : each[1].trim().includes("$") ? convertShorthandToNumber(each[1].trim().replace("$", "")) : each[1].trim();
            bPrices.push(obj);
        });
    }
    return bPrices;
};
const timeToDays = (data) => {
    const matches = data.match(/(\d+(\.\d+)?)([a-zA-Z]+)/);
    const time = matches ? matches[1] : null;
    const unit = matches ? matches[3] : null;
    if (time === null || unit === null)
        return;
    let days;
    if (unit === 'm') {
        days = Number(time) / 60 / 24;
    }
    else if (unit === 's') {
        days = Number(time) / 60 / 60 / 24;
    }
    else if (unit === 'h') {
        days = Number(time) / 24;
    }
    else if (unit === 'y') {
        days = Number(time) * 365;
    }
    else {
        days = Number(time);
    }
    return Number.isInteger(days) ? Number(days) : Number(days.toFixed(4));
};
const timeToDays1 = (data) => {
    const days = data.split(/[-\s]+/);
    let total = 0;
    days.map((day) => {
        total += timeToDays(day);
    });
    return total.toFixed(4);
};
const timeToDays2 = (data) => {
    const days = data.split(" ");
    let total = 0;
    days.map((day) => {
        total += timeToDays(day);
    });
    return total.toFixed(4);
};
const parseKeyValueForRickBurpBot = (str, key) => {
    var _a;
    let index;
    if (key === 'Liq_warning' || key === 'Sellability' || key === 'Blacklisted') {
        index = 1;
    }
    else if (key === 'Buy_Tax' || key === 'Sell_Tax') {
        index = 1;
    }
    else if (key === 'locked_burnt' || key === 'locked_for' || key === 'Warnings') {
        index = 1;
    }
    else {
        index = str.indexOf(key);
    }
    if (index === -1)
        return null;
    const subStr = str.substring(index + key.length);
    let regex;
    if (key === 'USD:') {
        regex = /\d+(\.\d+)?/;
        const match = subStr.match(regex);
        return match ? (match[0].trim()) : null;
    }
    else if (key === 'Liq_warning') {
        const match = str.includes("LOW LIQ WARNING");
        return match ? "LOW LIQ WARNING" : null;
    }
    else if (key === 'Sellability') {
        const match = str.includes("Most wallets can't sell");
        return match ? "Most wallets can't sell" : null;
    }
    else if (key === 'Blacklisted') {
        regex = /🅱️(.*)\n\n/;
        const match = subStr.match(regex);
        return match ? match[1].trim() : null;
    }
    else if (key === 'Liq:' || key === 'ATH:') {
        regex = /(?:0)\d+|\d+(\.\d+)\w/;
        const match = subStr.match(regex);
        return match ? convertShorthandToNumber(match[0].trim()) : null;
    }
    else if (key === 'Vol:') {
        regex = /\d+\w/;
        const match = subStr.match(regex);
        return match ? convertShorthandToNumber(match[0].trim()) : null;
    }
    else if (key === 'Age:') {
        regex = /\d+\w/;
        const match = subStr.match(regex);
        return match ? timeToDays(match[0].trim()) : null;
    }
    else if (key === 'SIM:')
        regex = /✅ | FAILED/;
    else if (key === 'HP:') {
        regex = /✅ | Not sure | (\*\*YES\*\*)/;
        const match = subStr.match(regex);
        const pattern = /\*\*/g;
        return match ? match[0].trim().replace(pattern, '') : null;
    }
    else if (key === 'TH:') {
        regex = /TH:\s*`(\d+)`/;
        const match = subStr.match(regex);
        return match ? match[1].trim() : null;
    }
    else if (key === 'AT:')
        regex = /\d+/;
    else if (key === 'Score:')
        regex = /\d+/;
    else if (key === 'TOP:') {
        regex = /\d.+/;
        const match = subStr.match(regex);
        return match ? convertHoldersToFomarts(match[0].trim()) : null;
    }
    else if (key === 'Buy_Tax') {
        regex = /T: `([^`]+)`/;
        const match = str.match(regex);
        const buy = match ? match[1].split("/") : null;
        if (buy !== null && buy[1]) {
            return buy[0].trim();
        }
        else
            return null;
    }
    else if (key === 'Sell_Tax') {
        regex = /T: `([^`]+)`/;
        const match = str.match(regex);
        const sell = match ? match[1].split("/") : null;
        if (sell !== null && sell[1]) {
            return sell[1].trim();
        }
        else
            return null;
    }
    else if (key === 'locked_burnt') {
        regex = /Unicrypt: ([\d.]+%)\s*(\d+\s*\w+)(?:\s*and\s*([\d.]+\s*\w+))?/;
        const match = subStr.match(regex);
        return match ? match[1].trim() : null;
    }
    else if (key === 'locked_for') {
        regex = /Unicrypt: ([\d.]+%)\s*(\d+\s*\w+)(?:\s*and\s*([\d.]+\s*\w+))?/;
        const match = subStr.match(regex);
        const data1 = match ? (_a = match[2]) === null || _a === void 0 ? void 0 : _a.trim().replace(" years", "y") : null;
        const data2 = match ? match[3] ? match[3].trim().replace(" days", "d") : '' : '';
        return data1 || data2 ? timeToDays2(data1 + " " + data2) : null;
    }
    else if (key === 'Warnings') {
        regex = /🚨(.*?)\n/g;
        const pattern = /[^a-zA-Z0-9.%\s]/g;
        const match = str.match(regex);
        let warnings = [];
        if (match && match.length > 0) {
            match.map((each) => {
                const cleanedString = each.trim().replace(pattern, '');
                let obj = {};
                let keyname = "Warning";
                obj[keyname] = cleanedString.trim();
                warnings.push(obj);
            });
        }
        return warnings.length > 0 ? warnings : null;
    }
    const match = subStr.match(regex);
    return match ? match[0].trim() : null;
};
const parseKeyValueForSafeAnalyzerbot = (str, key) => {
    let index;
    if (key === 'TopHolders:') {
        index = str.indexOf('Holders:');
    }
    else if (key === 'Unicrypt:') {
        index = str.indexOf('Lock:');
    }
    else if (key === 'Tax_Buy:') {
        index = str.indexOf('Tax:');
    }
    else if (key === 'Tax_Sell:') {
        index = str.indexOf('Tax:');
    }
    else if (key === 'RiskScore:') {
        index = 1;
    }
    else {
        index = str.indexOf(key);
    }
    if (index === -1)
        return null;
    let subStr = str.substring(index + key.length);
    let regex;
    if (key === 'Owner:')
        regex = /[a-zA-Z]+/g;
    else if (key === 'Holders:')
        regex = /\d+/;
    else if (key === 'TopHolders:') {
        regex = /\|\s*(?:🏧)?\d.+/;
        const pattern = /🏧/g;
        const match = subStr.match(regex);
        return match ? convertHoldersToFomarts(match[0].trim().replace(pattern, '')) : null;
    }
    else if (key === 'MCap:')
        regex = /\d+(\,\d+)?/;
    else if (key === 'Liquid:') {
        regex = /\$([\d,]+)\*\* +__\((.*?)\)/;
        const match = subStr.match(regex);
        return match ? match[1].trim() : null;
    }
    else if (key === 'ATH:')
        regex = /\d+(\,\d+)/;
    else if (key === 'Lock:') {
        regex = /\*\*\s*(.+?)\s*\*\*/;
        const match = subStr.match(regex);
        const pattern = /\*\*/g;
        return match ? match[1].trim().replace(pattern, '') : null;
    }
    else if (key === 'Tax_Buy:') {
        regex = /Buy:\s*([\d.]+)%/;
        const match = subStr.match(regex);
        return match ? match[1].trim() + "%" : null;
    }
    else if (key === 'Tax_Sell:') {
        regex = /Sell:\s*([\d.]+)%/;
        const match = subStr.match(regex);
        return match ? match[1].trim() + "%" : null;
    }
    else if (key === 'Unicrypt:')
        regex = /(\d+) days/;
    else if (key === 'Age:') {
        regex = /\*\*\s*([^\n]+)/;
        const match = subStr.match(regex);
        return match ? timeToDays1(match[1].trim()) : null;
    }
    else if (key === 'Options:') {
        regex = /\*\*\s*__([^_]+)__\s*/;
        const match = subStr.match(regex);
        let options = [];
        if (match) {
            const data = match[1].trim().split("🔘");
            data === null || data === void 0 ? void 0 : data.map((each, index) => {
                var _a, _b, _c;
                let obj = {};
                if (index > 0) {
                    if (each.includes('🚨')) {
                        const item = each.split('🚨');
                        const keyname2 = "Alarm";
                        const keyname1 = "Warning";
                        obj[keyname1] = item[0].trim().replace("**", "").trim();
                        obj[keyname2] = item[1].trim().replace('❗️', '').trim();
                        options.push(obj);
                    }
                    else {
                        const keyname = "Warning";
                        obj[keyname] = (_c = (_b = (_a = each.trim()) === null || _a === void 0 ? void 0 : _a.replace("**", "").trim().replace("|", "")) === null || _b === void 0 ? void 0 : _b.trim().replace("❗️", "")) === null || _c === void 0 ? void 0 : _c.trim().replace("**", "");
                        options.push(obj);
                    }
                }
            });
        }
        return options.length > 0 ? options : null;
    }
    else if (key === 'Warning:') {
        regex = /([^\n]+)(?=\s*\*\*__Help__)/;
        const match = subStr.match(regex);
        return match ? match[0].trim() : null;
    }
    else if (key === 'RiskScore:') {
        regex = /🔴|🟢/;
        const match = str.match(regex);
        return match ? match[0].trim() === '🔴' ? "Red light" : "Green Light" : null;
    }
    const match = subStr.match(regex);
    return match ? match[0].trim() : null;
};
const parseKeyValueForPirbViewBot = (str, key) => {
    var _a;
    let index;
    if (key === "Price_Changes") {
        index = str.indexOf("Price Changes");
    }
    else if (key === "Buys_Sells") {
        index = str.indexOf("Sells");
    }
    else if (key === "Max_Tx") {
        index = str.indexOf("Tx.**");
    }
    else if (key === "Volume") {
        index = str.indexOf("Volume**");
    }
    else if (key === "Blacklist") {
        index = str.indexOf("Blacklist**");
    }
    else if (key === "Warnings") {
        index = 1;
    }
    else {
        index = str.indexOf(key);
    }
    if (index === -1)
        return null;
    let subStr = str.substring(index + key.length);
    let regex;
    if (key === "MCap") {
        regex = /\d+(\.\d+\w+)?(\,\d+)?(\,\d+)?/;
        const match = subStr.match(regex);
        return match ? convertShorthandToNumber(match[0].trim()) : null;
    }
    else if (key === "ATH") {
        regex = /\d+(\.\d+\w+)?/;
        const match = subStr.match(regex);
        return match ? convertShorthandToNumber(match[0].trim()) : null;
    }
    else if (key === "Price")
        regex = /\d+(\.\d+\w+)?/;
    else if (key === "Liq") {
        regex = /\d+(\.\d+\w+)?(\,\d+)?(\,\d+)?/; //(\s*\(([^)]+)\))?/;
    }
    else if (key === "Price_Changes") {
        regex = /(\|)?\s*\d.+/;
        const match = subStr.match(regex);
        return match ? convertPriceChangesToFomarts(match[0].trim()) : null;
    }
    else if (key === "Volume") {
        regex = /(\|)?\s*\d.+/;
        const match = subStr.match(regex);
        return match ? convertPriceChangesToFomarts(match[0].trim()) : null;
    }
    else if (key === "Buys_Sells") {
        regex = /(\|)?\s*\d.+/;
        const match = subStr.match(regex);
        return match ? convertPriceChangesToFomarts(match[0].trim()) : null;
    }
    else if (key === "Max_Tx") {
        regex = /([^|\n]+)/;
    }
    else if (key === "Clog") {
        regex = /([\d.]+%)/;
    }
    else if (key === "Swap") {
        regex = /([\d.]+%)/;
    }
    else if (key === "Holders") {
        regex = /([\d.]+)/;
    }
    else if (key === "Blacklist") {
        regex = /([\d.]+)/;
    }
    else if (key === "Siphon") {
        regex = /([\d.]+)/;
    }
    else if (key === "Age") {
        regex = /(\|)?\s*\d.+/;
        const match = subStr.match(regex);
        return match ? timeToDays2(match[0].trim()) : null;
    }
    else if (key === "**B**") {
        regex = /([\d.]+)\%/;
    }
    else if (key === "**S**") {
        regex = /([\d.]+)\%/;
    }
    else if (key === "**T**") {
        regex = /([\d.]+)\%/;
    }
    else if (key === "Warnings") {
        regex = /🚨\s+([^,\n]+)/g;
        let matches = [];
        let match;
        while ((match = regex.exec(str)) !== null) {
            if (!match[1].trim().includes("%")) {
                const keyname = 'warning';
                let obj = {};
                obj[keyname] = match[1].trim();
                matches.push(obj);
            }
        }
        const regex1 = /⚠️\s+([^,(\d.+)?\n]+)/g;
        while ((match = regex1.exec(str)) !== null) {
            if (!match[1].trim().includes("%")) {
                const keyname = 'Alarm';
                let obj = {};
                obj[keyname] = (_a = match[1].trim()) === null || _a === void 0 ? void 0 : _a.replace("**", "").replace(".**", "");
                matches.push(obj);
            }
        }
        return matches.length > 0 ? matches : null;
    }
    const match = subStr.match(regex);
    return match ? match[0].trim() : null;
};
const parseKeyValueForttfbotbot = (str, key) => {
    let index;
    if (key === "Tax_Buy") {
        index = str.indexOf("Tax");
    }
    else if (key === "Tax_Sell") {
        index = str.indexOf("Tax");
    }
    else if (key === "Tops") {
        index = str.indexOf("Top 10");
    }
    else if (key === "TeamWallets" || key === "Alarms") {
        index = 1;
    }
    else {
        index = str.indexOf(key);
    }
    if (index === -1)
        return null;
    let subStr = str.substring(index + key.length);
    let regex;
    if (key === 'Owner')
        regex = /[a-zA-Z]+/g;
    else if (key === "ATH") {
        regex = /\d+(\.\d+\w+)?(\,\d+)?(\,\d+)?/;
        const match = subStr.match(regex);
        return match ? convertShorthandToNumber(match[0].trim()) : null;
    }
    else if (key === "Price")
        regex = /\d+(\.\d+\w+)?/;
    else if (key === "MC") {
        regex = /\d+(\.\d+\w+)?/;
        const match = subStr.match(regex);
        return match ? convertShorthandToNumber(match[0].trim()) : null;
    }
    else if (key === "Liq") {
        regex = /\d+(\.\d+\w+)?(\,\d+)?(\,\d+)?/;
        const match = subStr.match(regex);
        return match ? convertShorthandToNumber(match[0].trim()) : null;
    }
    else if (key === "Lock") {
        regex = /\*\*:\s*(.*?)[,\n]/;
        const match = subStr.match(regex);
        return match ? match[1].trim() : null;
    }
    else if (key === "Tax_Buy") {
        regex = /B:\s*(\d+%)/;
        const match = subStr.match(regex);
        return match ? match[1].trim() : null;
    }
    else if (key === "Tax_Sell") {
        regex = /S:\s*(\d+%)/;
        const match = subStr.match(regex);
        return match ? match[1].trim() : null;
    }
    else if (key === "Airdrops") {
        const pattern = /\*\*Airdrops:\*\* (\d+ for a total of \d+\.\d+%)/;
        regex = /\*\*Airdrops:\*\* \*\*(.*?)\*\*/;
        const match1 = str.match(pattern);
        const match2 = str.match(regex);
        return match1 ? match1[1].trim() : match2 ? match2[1].trim() : null;
    }
    else if (key === "Holders") {
        regex = /([\d.]+)/;
    }
    else if (key === "Age") {
        regex = /(\|)?\s*\d.+/;
        const match = subStr.match(regex);
        return match ? timeToDays2(match[0].trim().replace(" minutes", "m").replace(" hours", "h").replace(" day", "d")) : null;
    }
    else if (key === 'Tops') {
        regex = /\d+(\.\d+)?%/;
    }
    else if (key === 'TeamWallets') {
        regex = /\*\*TEAM WALLETS\*\*\n([^]*?)(?=\n\n|$)/;
        ;
        const match = subStr.match(regex);
        if (match) {
            const data = match[1].split("\n");
            let wallets = [];
            if (data.length > 0) {
                data.map((each) => {
                    const record = each.trim().split(":");
                    const keyname = record[0].trim();
                    const valuedata = record[1].trim().split("|");
                    let _wallets = [];
                    if (valuedata.length > 0) {
                        valuedata.map((val) => {
                            const _val = val.trim().split(" ");
                            let obj = {};
                            let _keyname = _val[1].trim();
                            obj[_keyname] = _val[0].trim();
                            _wallets.push(obj);
                        });
                    }
                    let obj1 = {};
                    obj1[keyname] = _wallets;
                    wallets.push(obj1);
                });
            }
            return wallets.length > 0 ? wallets : null;
        }
    }
    else if (key === 'Alarms') {
        regex = /⚠️️(.*?)(\n\n|$)/s;
        let match = regex.exec(str);
        let warnings = [];
        if (match && match[1]) {
            if (match[1].trim().includes('**SUSPICIOUS FUNCTIONS**') && match[1].trim().includes("Function:")) {
                const regex1 = /\Function\b/gi;
                const matches1 = str.match(regex1);
                if (matches1 && matches1.length > 0) {
                    const regex2 = /Function: (.+)(\|)?/g;
                    let match2;
                    while ((match2 = regex2.exec(str)) !== null) {
                        let obj = {};
                        let keyname = 'Function';
                        if (match2[1].trim().includes('|')) {
                            const __ematch = match2[1].trim().split('|');
                            obj[keyname] = __ematch[0].trim();
                        }
                        else {
                            obj[keyname] = match2[1].trim();
                        }
                        warnings.push(obj);
                    }
                }
            }
            const _warnings = match[1].trim().split("|");
            if (_warnings && _warnings.length > 0) {
                let keyname = 'Alarm';
                _warnings.map((each) => {
                    if (!each.includes("SUSPICIOUS FUNCTIONS")) {
                        if (each.trim().includes('\n')) {
                            const _each = each.trim().split('\n');
                            if (_each && _each.length > 0) {
                                _each.map((__each) => {
                                    let obj1 = {};
                                    obj1[keyname] = __each.trim().replace(/\**/g, "").trim().replace('⚠️️', '').trim();
                                    warnings.push(obj1);
                                });
                            }
                        }
                        else {
                            let obj2 = {};
                            obj2[keyname] = each.trim().replace(/\**/g, "").trim().replace('⚠️️', '').trim();
                            warnings.push(obj2);
                        }
                    }
                });
            }
        }
        const wregex = /(?:🚫|🛑)(.*?)(?:🚫|🛑)/g;
        let wmatch;
        while ((wmatch = wregex.exec(str)) !== null) {
            let obj3 = {};
            let keyname = 'Warning';
            obj3[keyname] = wmatch[1];
            warnings.push(obj3);
        }
        ;
        return warnings.length > 0 ? warnings : null;
    }
    const match = subStr.match(regex);
    return match ? match[0].trim() : null;
};
const parseKeyValueForOttoSimBot = (str, key) => {
    let index;
    if (key === "SnipeMethod") {
        index = str.indexOf("Snipe Method");
    }
    else if (key === "Max_TX") {
        index = str.indexOf("Max Tx");
    }
    else if (key === "Max_TxPercentage") {
        index = str.indexOf("Max Tx");
    }
    else if (key === "Max_Wallet") {
        index = str.indexOf("Max Wallet");
    }
    else if (key === "Max_Wallet_Percentage") {
        index = str.indexOf("Max Wallet");
    }
    else if (key === "Token_Simmulation_Buy_Sell_Transfer_Tax") {
        index = str.indexOf("Token Simulation");
    }
    else {
        index = str.indexOf(key);
    }
    if (index === -1)
        return null;
    let subStr = str.substring(index + key.length);
    let regex;
    if (key === "SnipeMethod") {
        regex = /`([^`]+)`/;
        const match = regex.exec(subStr);
        return match ? match[1].trim() : null;
    }
    else if (key === "Max_TX") {
        regex = /`([^`]+)`/;
        const match = regex.exec(subStr);
        return match ? match[1].trim() : null;
    }
    else if (key === "Max_TxPercentage") {
        regex = /\(([^)]+)\)/;
        const match = regex.exec(subStr);
        return match ? match[1].trim().replace(/`/g, '').trim() : null;
    }
    else if (key === "Max_Wallet") {
        regex = /`([^`]+)`/;
        const match = regex.exec(subStr);
        return match ? match[1].trim() : null;
    }
    else if (key === "Max_Wallet_Percentage") {
        regex = /\(([^)]+)\)/;
        const match = regex.exec(subStr);
        return match ? match[1].trim().replace(/`/g, '').trim() : null;
    }
    else if (key === "Token_Simmulation_Buy_Sell_Transfer_Tax") {
        regex = /└(.*?)\n/g;
        const matches = subStr.match(regex);
        const regexPattern = /[a-zA-Z]+/g;
        const regexPattern1 = /\d+%/g;
        let blocks = [];
        if (matches && matches.length > 0) {
            matches.map((each) => {
                const matchess = each.match(regexPattern);
                const keyname = matchess[0].trim();
                const _matchess = each.match(regexPattern1);
                const data = [];
                const keyname1 = 'Buy';
                const keyname2 = 'Sell';
                const keyname3 = 'Transer';
                if (_matchess && _matchess.length > 0) {
                    let obj = {};
                    obj[keyname1] = _matchess[0] ? _matchess[0] : null;
                    obj[keyname2] = _matchess[1] ? _matchess[1] : null;
                    obj[keyname3] = _matchess[2] ? _matchess[2] : null;
                    data.push(obj);
                }
                let obj1 = {};
                obj1[keyname] = data;
                blocks.push(obj1);
            });
        }
        return blocks.length > 0 ? blocks : null;
    }
    const match = subStr.match(regex);
    return match ? match[0].trim() : null;
};
const TokenScanScript = (document) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    try {
        yield client.connect();
        console.log('Connected to MongoDB server');
        const database = client.db("ERC20PnL");
        const tokenScanResults = database.collection("tokenScanResults");
        if (document.sender.username === 'RickBurpBot') {
            const newDocument = {
                id: document.id,
                ScannerBotName: (_a = document.sender) === null || _a === void 0 ? void 0 : _a.username.trim(),
                tokenAddress: (_b = document.token) === null || _b === void 0 ? void 0 : _b.address.trim(),
                tokenName: (_c = document.token) === null || _c === void 0 ? void 0 : _c.name.trim(),
                TokenSymbol: (_d = document.token) === null || _d === void 0 ? void 0 : _d.symbol.trim(),
                Price: parseKeyValueForRickBurpBot(document.text, "USD:"),
                Liquidity: parseKeyValueForRickBurpBot(document.text, "Liq:"),
                Volume: parseKeyValueForRickBurpBot(document.text, "Vol:"),
                AGE: parseKeyValueForRickBurpBot(document.text, "Age:"),
                ATH_MarketCap: parseKeyValueForRickBurpBot(document.text, "ATH:"),
                Buy_Tax: parseKeyValueForRickBurpBot(document.text, "Buy_Tax"),
                Sell_Tax: parseKeyValueForRickBurpBot(document.text, "Sell_Tax"),
                Liquidity_locked_burnt: parseKeyValueForRickBurpBot(document.text, "locked_burnt"),
                Liquidity_locked_for: parseKeyValueForRickBurpBot(document.text, "locked_for"),
                SIM: parseKeyValueForRickBurpBot(document.text, "SIM:"),
                HP: parseKeyValueForRickBurpBot(document.text, "HP:"),
                Holders: parseKeyValueForRickBurpBot(document.text, "TH:"),
                Average_Tax: parseKeyValueForRickBurpBot(document.text, "AT:"),
                Contract_Checksum_Score: parseKeyValueForRickBurpBot(document.text, "Score:"),
                Biggest_holders: parseKeyValueForRickBurpBot(document.text, "TOP:"),
                Warnings: parseKeyValueForRickBurpBot(document.text, "Warnings"),
                Liq_warning: parseKeyValueForRickBurpBot(document.text, "Liq_warning"),
                Sellability: parseKeyValueForRickBurpBot(document.text, "Sellability"),
                Blacklisted: parseKeyValueForRickBurpBot(document.text, "Blacklisted")
            };
            console.log("RickBurpBot=>", newDocument);
            const insertResult = yield tokenScanResults.insertOne(newDocument);
            if (insertResult.insertedId) {
                console.log(`Success: Latest message from ${'RickBurpBot'} written to tokenScanResults with new _id: ${insertResult.insertedId}.`);
            }
            else {
                console.log(`Failed to write message from ${'RickBurpBot'} to tokenScanResults.`);
            }
        }
        if (document.sender.username === 'SafeAnalyzerbot') {
            const newDocument = {
                id: document.id,
                ScannerBotName: document.sender.username.trim(),
                tokenAddress: (_e = document.token) === null || _e === void 0 ? void 0 : _e.address.trim(),
                tokenName: (_f = document.token) === null || _f === void 0 ? void 0 : _f.name.trim(),
                TokenSymbol: (_g = document.token) === null || _g === void 0 ? void 0 : _g.symbol.trim(),
                RiskScore: parseKeyValueForSafeAnalyzerbot(document.text, "RiskScore:"),
                Owner: parseKeyValueForSafeAnalyzerbot(document.text, "Owner:"),
                Holders: parseKeyValueForSafeAnalyzerbot(document.text, "Holders:"),
                TopHolders: parseKeyValueForSafeAnalyzerbot(document.text, "TopHolders:"),
                MarketCap: parseKeyValueForSafeAnalyzerbot(document.text, "MCap:"),
                Liquidity: parseKeyValueForSafeAnalyzerbot(document.text, "Liquid:"),
                ATH_MarketCap: parseKeyValueForSafeAnalyzerbot(document.text, "ATH:"),
                Liquidity_locked_burnt: parseKeyValueForSafeAnalyzerbot(document.text, "Lock:"),
                Liquidity_locked_for: parseKeyValueForSafeAnalyzerbot(document.text, "Unicrypt:"),
                Tax_Buy: parseKeyValueForSafeAnalyzerbot(document.text, "Tax_Buy:"),
                Tax_Sell: parseKeyValueForSafeAnalyzerbot(document.text, "Tax_Sell:"),
                AGE: parseKeyValueForSafeAnalyzerbot(document.text, "Age:"),
                Options: parseKeyValueForSafeAnalyzerbot(document.text, "Options:"),
                Warning: parseKeyValueForSafeAnalyzerbot(document.text, "Warning:"),
            };
            console.log("SafeAnalyzerbot=>", newDocument);
            const insertResult = yield tokenScanResults.insertOne(newDocument);
            if (insertResult.insertedId) {
                console.log(`Success: Latest message from ${'RickBurpBot'} written to tokenScanResults with new _id: ${insertResult.insertedId}.`);
            }
            else {
                console.log(`Failed to write message from ${'RickBurpBot'} to tokenScanResults.`);
            }
        }
        if (document.sender.username === 'PirbViewBot') {
            const newDocument = {
                id: document.id,
                ScannerBotName: document.sender.username.trim(),
                tokenAddress: (_h = document.token) === null || _h === void 0 ? void 0 : _h.address.trim(),
                tokenName: (_j = document.token) === null || _j === void 0 ? void 0 : _j.name.trim(),
                TokenSymbol: (_k = document.token) === null || _k === void 0 ? void 0 : _k.symbol.trim(),
                MCap: parseKeyValueForPirbViewBot(document.text, "MCap"),
                ATH_MarketCap: parseKeyValueForPirbViewBot(document.text, "ATH"),
                Price: parseKeyValueForPirbViewBot(document.text, "Price"),
                Liq: parseKeyValueForPirbViewBot(document.text, "Liq"),
                Price_Changes: parseKeyValueForPirbViewBot(document.text, "Price_Changes"),
                Volume: parseKeyValueForPirbViewBot(document.text, "Volume"),
                Buys_Sells: parseKeyValueForPirbViewBot(document.text, "Buys_Sells"),
                Max_Tx: parseKeyValueForPirbViewBot(document.text, "Max_Tx"),
                Clog: parseKeyValueForPirbViewBot(document.text, "Clog"),
                Swap: parseKeyValueForPirbViewBot(document.text, "Swap"),
                Holders: parseKeyValueForPirbViewBot(document.text, "Holders"),
                Blacklist: parseKeyValueForPirbViewBot(document.text, "Blacklist"),
                Siphon: parseKeyValueForPirbViewBot(document.text, "Siphon"),
                Age: parseKeyValueForPirbViewBot(document.text, "Age"),
                Buy: parseKeyValueForPirbViewBot(document.text, "**B**"),
                Sell: parseKeyValueForPirbViewBot(document.text, "**S**"),
                Tax: parseKeyValueForPirbViewBot(document.text, "**T**"),
                Warnings: parseKeyValueForPirbViewBot(document.text, "Warnings"),
            };
            console.log("PirbViewBot=>", newDocument);
            const insertResult = yield tokenScanResults.insertOne(newDocument);
            if (insertResult.insertedId) {
                console.log(`Success: Latest message from ${'RickBurpBot'} written to tokenScanResults with new _id: ${insertResult.insertedId}.`);
            }
            else {
                console.log(`Failed to write message from ${'RickBurpBot'} to tokenScanResults.`);
            }
        }
        if (document.sender.username === 'ttfbotbot') {
            const newDocument = {
                id: document.id,
                ScannerBotName: document.sender.username.trim(),
                tokenAddress: (_l = document.token) === null || _l === void 0 ? void 0 : _l.address.trim(),
                tokenName: (_m = document.token) === null || _m === void 0 ? void 0 : _m.name.trim(),
                TokenSymbol: (_o = document.token) === null || _o === void 0 ? void 0 : _o.symbol.trim(),
                Owner: parseKeyValueForttfbotbot(document.text, "Owner"),
                ATH_MarketCap: parseKeyValueForttfbotbot(document.text, "ATH"),
                Price: parseKeyValueForttfbotbot(document.text, "Price"),
                MC: parseKeyValueForttfbotbot(document.text, "MC"),
                Liq: parseKeyValueForttfbotbot(document.text, "Liq"),
                LP_Lock: parseKeyValueForttfbotbot(document.text, "Lock"),
                Tax_Buy: parseKeyValueForttfbotbot(document.text, "Tax_Buy"),
                Tax_Sell: parseKeyValueForttfbotbot(document.text, "Tax_Sell"),
                Airdrops: parseKeyValueForttfbotbot(document.text, "Airdrops"),
                Holders: parseKeyValueForttfbotbot(document.text, "Holders"),
                Age: parseKeyValueForttfbotbot(document.text, "Age"),
                TeamWallets: parseKeyValueForttfbotbot(document.text, "TeamWallets"),
                Top10: parseKeyValueForttfbotbot(document.text, "Tops"),
                Notices: parseKeyValueForttfbotbot(document.text, "Alarms"),
            };
            console.log("ttfbotbot=>", newDocument);
            const insertResult = yield tokenScanResults.insertOne(newDocument);
            if (insertResult.insertedId) {
                console.log(`Success: Latest message from ${'ttfbotbot'} written to tokenScanResults with new _id: ${insertResult.insertedId}.`);
            }
            else {
                console.log(`Failed to write message from ${'ttfbotbot'} to tokenScanResults.`);
            }
        }
        if (document.sender.username === 'OttoSimBot') {
            const newDocument = {
                id: document.id,
                ScannerBotName: (_p = document.sender) === null || _p === void 0 ? void 0 : _p.username.trim(),
                tokenAddress: (_q = document.token) === null || _q === void 0 ? void 0 : _q.address.trim(),
                tokenName: (_r = document.token) === null || _r === void 0 ? void 0 : _r.name.trim(),
                TokenSymbol: (_s = document.token) === null || _s === void 0 ? void 0 : _s.symbol.trim(),
                SnipeMethod: parseKeyValueForOttoSimBot(document.text, "SnipeMethod"),
                Max_TX: parseKeyValueForOttoSimBot(document.text, "Max_TX"),
                Max_TxPercentage: parseKeyValueForOttoSimBot(document.text, "Max_TxPercentage"),
                Max_Wallet: parseKeyValueForOttoSimBot(document.text, "Max_Wallet"),
                Max_Wallet_Percentage: parseKeyValueForOttoSimBot(document.text, "Max_Wallet_Percentage"),
                Token_Simmulation_Buy_Sell_Transfer_Tax: parseKeyValueForOttoSimBot(document.text, "Token_Simmulation_Buy_Sell_Transfer_Tax"),
            };
            const query = { id: document.id };
            const completeDocument = yield tokenScanResults.findOne(query);
            if (!completeDocument) {
                console.log("OttoSimBot=>", newDocument);
                const insertResult = yield tokenScanResults.insertOne(newDocument);
                if (insertResult.insertedId) {
                    console.log(`Success: Latest message from ${'OttoSimBot'} written to tokenScanResults with new _id: ${insertResult.insertedId}.`);
                }
                else {
                    console.log(`Failed to write message from ${'OttoSimBot'} to tokenScanResults.`);
                }
            }
        }
    }
    catch (error) {
        console.error("An error occurred:", error);
    }
});
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.connect();
        console.log('Connected to MongoDB server');
        const database = client.db("ERC20PnL");
        const collection = database.collection('tgMessages');
        const changeStream = collection.watch();
        changeStream.on('change', (change) => __awaiter(void 0, void 0, void 0, function* () {
            const operationType = change.operationType;
            const fullDocument = change.fullDocument;
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                var _t, _u, _v;
                if (fullDocument && ((_t = fullDocument.chat) === null || _t === void 0 ? void 0 : _t.title) === 'furiosaCalls group') { //furiosaCalls group //Ape Analyser Group
                    if (((_u = fullDocument.sender) === null || _u === void 0 ? void 0 : _u.username) === 'RickBurpBot' || fullDocument.sender.username === 'SafeAnalyzerbot' || fullDocument.sender.username === 'PirbViewBot' || fullDocument.sender.username === 'ttfbotbot' || ((_v = fullDocument.sender) === null || _v === void 0 ? void 0 : _v.username) === 'OttoSimBot') {
                        if (operationType === 'insert' || operationType === 'update') {
                            const documentId = change.fullDocument.id;
                            const query = { id: documentId };
                            const sortCriteria = { processedAt: -1 };
                            const completeDocument = yield collection.findOne(query, { sort: sortCriteria });
                            if (completeDocument === null || completeDocument === void 0 ? void 0 : completeDocument.token) {
                                console.log('detectedDocument::', completeDocument);
                                yield TokenScanScript(completeDocument);
                            }
                        }
                    }
                    // else if (fullDocument.sender?.username === 'OttoSimBot'){
                    //   if (operationType === 'insert' || operationType === 'update') {
                    //     const documentId = change.fullDocument.id;
                    //     const query = { id: documentId };
                    //     const sortCriteria = { processedAt: -1 };
                    //     const completeDocument = await collection.findOne(query, { sort: sortCriteria } as any);
                    //     if (completeDocument?.token) {
                    //       console.log('OttoSimBot::', completeDocument.processedAt);
                    //       await TokenScanScript(completeDocument);
                    //     }
                    //   }
                    // }
                }
            }), 40000);
        }));
        changeStream.on('error', (error) => {
            console.error('Change stream error:', error);
        });
        yield new Promise(resolve => {
            process.on('SIGINT', resolve);
        });
    }
    catch (error) {
        console.error("An error occurred:", error);
    }
    finally {
        yield client.close();
    }
});
run();
const app = (0, express_1.default)();
const port = 5000;
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Access-Control-Allow-Origin",
    ],
}));
app.get('/', (req, res) => {
    res.send('Hello from Node API!');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
