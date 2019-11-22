"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const webhook_1 = require("@slack/webhook");
class Client {
    constructor(props, github) {
        this.with = props;
        this.github = github;
        if (process.env.SLACK_WEBHOOK_URL === undefined) {
            throw new Error('Specify secrets.SLACK_WEBHOOK_URL');
        }
        this.webhook = new webhook_1.IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
    }
    success(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.payloadTemplate();
            template.attachments[0].color = 'good';
            template.text += `:heavy_check_mark: Successful GitHub Action ${this.actionLink}\n`;
            template.text += text;
            this.send(template);
        });
    }
    fail(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.payloadTemplate();
            template.attachments[0].color = 'danger';
            if (this.with.only_mention_fail !== '') {
                template.text += `<!${this.with.only_mention_fail}> `;
            }
            template.text += `:no_entry: Failed GitHub Action ${this.actionLink}\n`;
            template.text += text;
            this.send(template);
        });
    }
    cancel(text) {
        return __awaiter(this, void 0, void 0, function* () {
            const template = yield this.payloadTemplate();
            template.attachments[0].color = 'warning';
            template.text += `:warning: Canceled Github Action ${this.actionLink}\n`;
            template.text += text;
            this.send(template);
        });
    }
    send(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(JSON.stringify(github.context, null, 2));
            const toSend = JSON.stringify(payload, null, 2);
            console.log('Sending message: ' + toSend);
            yield this.webhook.send(payload);
        });
    }
    get actionLink() {
        const { sha } = github.context;
        const { owner, repo } = github.context.repo;
        return `<https://github.com/${owner}/${repo}/commit/${sha}/checks|${github.context.workflow}>`;
    }
    payloadTemplate() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.github === undefined) {
                throw Error('Specify secrets.GITHUB_TOKEN');
            }
            let text = '';
            if (this.with.mention !== '') {
                text += `<!${this.with.mention}> `;
            }
            const { sha } = github.context;
            const { owner, repo } = github.context.repo;
            const commit = yield this.github.repos.getCommit({ owner, repo, ref: sha });
            const { author } = commit.data.commit;
            return {
                text: text,
                icon_emoji: this.with.icon_emoji,
                icon_url: this.with.icon_url,
                username: this.with.username,
                channel: this.with.channel,
                attachments: [
                    {
                        color: '',
                        author_name: this.with.author_name !== '__COMMITTER__' ? this.with.author_name : `${author.name}<${author.email}>`,
                        fields: this.fields(commit),
                    },
                ],
            };
        });
    }
    fields(commit) {
        if (this.github === undefined) {
            throw Error('Specify secrets.GITHUB_TOKEN');
        }
        const { author } = commit.data.commit;
        return [
            {
                title: 'message',
                value: commit.data.commit.message,
                short: false,
            },
            this.repo,
            this.commit,
            {
                title: 'author',
                value: `${author.name}<${author.email}>`,
                short: true,
            },
            this.action,
            this.eventName,
            this.ref,
            this.workflow,
        ].filter(v => !this.with.exclude_fields.includes(v.title));
    }
    get commit() {
        const { sha } = github.context;
        const { owner, repo } = github.context.repo;
        return {
            title: 'commit',
            value: `<https://github.com/${owner}/${repo}/commit/${sha}|${sha.substring(0, 6)}...>`,
            short: true,
        };
    }
    get repo() {
        const { owner, repo } = github.context.repo;
        return {
            title: 'repo',
            value: `<https://github.com/${owner}/${repo}|${owner}/${repo}>`,
            short: true,
        };
    }
    get action() {
        const { sha } = github.context;
        const { owner, repo } = github.context.repo;
        return {
            title: 'action',
            value: this.actionLink,
            short: true,
        };
    }
    get eventName() {
        return {
            title: 'eventName',
            value: github.context.eventName,
            short: true,
        };
    }
    get ref() {
        return { title: 'ref', value: github.context.ref, short: true };
    }
    get workflow() {
        return { title: 'workflow', value: github.context.workflow, short: true };
    }
}
exports.Client = Client;
