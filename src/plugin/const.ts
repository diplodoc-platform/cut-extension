export const ENV_FLAG_NAME = 'has-yfm-cut';

export const TokenType = {
    Cut: 'yfm_cut',
    CutOpen: 'yfm_cut_open',
    CutClose: 'yfm_cut_close',
    Title: 'yfm_cut_title',
    TitleOpen: 'yfm_cut_title_open',
    TitleClose: 'yfm_cut_title_close',
    Content: 'yfm_cut_content',
    ContentOpen: 'yfm_cut_content_open',
    ContentClose: 'yfm_cut_content_close',
} as const;

export const ClassNames = {
    Cut: 'yfm-cut',
    Title: 'yfm-cut-title',
    Content: 'yfm-cut-content',
    Highlight: 'yfm-cut-highlight',
} as const;
