import type MarkdownIt from 'markdown-it';
import type {ContainerDirectiveHandler, ContainerDirectiveParams} from '@diplodoc/directive';
import type {CutDiagnostic} from './transform';

import {directiveParser, registerContainerDirective} from '@diplodoc/directive';

import {ClassNames, ENV_FLAG_NAME, TokenType} from './const';
import {titleAttributes} from './attributes';

const allowedAttributes = new Set(['id', 'class', 'open', 'name']);

function invalidReason(
    params: ContainerDirectiveParams,
    state: Parameters<ContainerDirectiveHandler>[0],
): string | undefined {
    if (params.dests) {
        // The upstream parser also infers a destination from a prior reference
        // matching the title. Only reject a destination written after the title.
        const suffix = params.inlineContent
            ? state.src
                  .slice(params.inlineContent.endPos + 1, state.eMarks[params.startLine])
                  .trimStart()
            : '';
        if (!params.inlineContent || suffix.startsWith('(') || suffix.startsWith('[')) {
            return 'Destinations are not supported for cut directives';
        }
    }
    if (params.contentTitle) return 'Invalid cut directive parameters';

    for (const [name, value] of Object.entries(params.attrs ?? {})) {
        if (!allowedAttributes.has(name)) return `Unknown cut attribute: ${name}`;
        if (name !== 'class' && Array.isArray(value)) return `Repeated cut attribute: ${name}`;
        if (name === 'open' && value !== 'true' && value !== 'false') {
            return 'The cut open attribute must be true or false';
        }
    }
    return undefined;
}

function detailsAttributes({attrs}: ContainerDirectiveParams): Record<string, string> {
    const result: Record<string, string> = {class: ClassNames.Cut};
    if (attrs?.class) {
        result.class += ` ${Array.isArray(attrs.class) ? attrs.class.join(' ') : attrs.class}`;
    }
    if (attrs?.id && typeof attrs.id === 'string') result.id = '';
    if (typeof attrs?.name === 'string') result.name = attrs.name;
    if (attrs?.open === 'true') result.open = 'true';
    return result;
}

export const cutDirective =
    (onDiagnostic?: (diagnostic: CutDiagnostic) => void): MarkdownIt.PluginSimple =>
    (md) => {
        md.use(directiveParser());

        registerContainerDirective(md, {
            name: 'cut',
            onConflict: 'error',
            match(params, state) {
                const reason = invalidReason(params, state);
                if (reason) {
                    onDiagnostic?.({line: params.startLine + 1, reason});
                    return false;
                }
                state.env ??= {};
                state.env[ENV_FLAG_NAME] = true;

                return true;
            },
            container: {
                tag: 'details',
                token: TokenType.Cut,
                attrs: detailsAttributes,
            },
            inlineContent: {
                required: false,
                tag: 'summary',
                token: TokenType.Title,
                attrs: ({attrs}) =>
                    titleAttributes(typeof attrs?.id === 'string' ? attrs.id : undefined),
            },
            content: {
                tag: 'div',
                token: TokenType.Content,
                attrs: {
                    class: ClassNames.Content,
                },
            },
        });
    };
