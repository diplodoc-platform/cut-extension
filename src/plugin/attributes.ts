import {ClassNames} from './const';

// The summary owns the author-provided ID so hash navigation can focus it.
export function titleAttributes(id?: string | null): Record<string, string> {
    const attrs: Record<string, string> = {class: ClassNames.Title};
    if (id) attrs.id = id;
    return attrs;
}
