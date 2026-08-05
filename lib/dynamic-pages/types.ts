// Shared types for user-configured, API-driven pages.
// A DynamicPage describes *how* to call an API and *how* to render its response,
// so the page UI can be built by a user instead of being written in code.

export const MAX_PAGES_PER_USER = 3;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'badge' | 'link' | 'image' | 'json';

export interface KeyValue {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

export interface ColumnConfig {
    /** Dot path into a row object, e.g. "user.name" or "images.0" for an array element. */
    key: string;
    label: string;
    type: ColumnType;
    visible: boolean;
    /**
     * Optional template applied to the value before display; {{value}} is replaced
     * with the API value. E.g. "https://my-bucket.s3.amazonaws.com/{{value}}" when
     * the API returns only an object key/ID. Applied per element for arrays.
     */
    template?: string;
    /** Value sent as the API's sort param when this column header is clicked. Falls back to `key`. */
    sortKey?: string;
    sortable?: boolean;
}

export interface FilterConfig {
    id: string;
    label: string;
    /** Query param name sent to the API. */
    param: string;
    type: 'text' | 'select' | 'date' | 'boolean';
    /** For type === 'select'. */
    options: { label: string; value: string }[];
    defaultValue?: string;
}

export interface CardConfig {
    titleKey?: string;
    subtitleKey?: string;
    imageKey?: string;
    badgeKey?: string;
    /** Extra key/label pairs shown in the card body. */
    fieldKeys: string[];
}

export interface StatConfig {
    id: string;
    label: string;
    /** Dot path into the *root* of the response, e.g. "meta.total" */
    path: string;
}

export interface ControlsConfig {
    searchEnabled: boolean;
    /**
     * How the search text reaches the API:
     * - 'param'    → sent as a query param (`searchParam`)
     * - 'body'     → written into the JSON body at `searchBodyPath` (non-GET)
     * - 'template' → replaces {{search}} tokens in the URL and body
     * - 'client'   → never sent; the fetched rows are filtered in the browser
     */
    searchMode: 'param' | 'body' | 'template' | 'client';
    /** Query param carrying the search text, e.g. "q" or "search". */
    searchParam: string;
    /** Dot path into the JSON body for searchMode 'body', e.g. "filters.query". */
    searchBodyPath: string;
    searchPlaceholder?: string;

    sortEnabled: boolean;
    /** Query param carrying the sort field, e.g. "sortBy". */
    sortParam: string;
    /** Query param carrying the direction, e.g. "order". Blank = don't send. */
    sortOrderParam: string;
    ascValue: string;
    descValue: string;

    paginationEnabled: boolean;
    pageParam: string;
    pageSizeParam: string;
    pageSize: number;
    /** Page number the API considers the first page. */
    startPage: number;
    /** Dot path to the total record count in the response, for page math. */
    totalPath?: string;

    filters: FilterConfig[];
}

export interface EndpointConfig {
    method: HttpMethod;
    url: string;
    headers: KeyValue[];
    queryParams: KeyValue[];
    /** JSON string, used for non-GET methods. */
    body: string;
    /** Route the call through the server instead of the browser (CORS escape hatch). */
    useProxy: boolean;
}

export interface DynamicPageConfig {
    _id?: string;
    name: string;
    description?: string;
    icon?: string;
    endpoint: EndpointConfig;
    /** Dot path to the array of rows in the response. "" means the response itself is the array. */
    rowsPath: string;
    layout: 'table' | 'cards';
    columns: ColumnConfig[];
    card: CardConfig;
    stats: StatConfig[];
    controls: ControlsConfig;
    createdAt?: string;
    updatedAt?: string;
}

export const DEFAULT_CONTROLS: ControlsConfig = {
    searchEnabled: true,
    searchMode: 'param',
    searchParam: 'search',
    searchBodyPath: '',
    searchPlaceholder: 'Search...',
    sortEnabled: false,
    sortParam: 'sortBy',
    sortOrderParam: 'order',
    ascValue: 'asc',
    descValue: 'desc',
    paginationEnabled: false,
    pageParam: 'page',
    pageSizeParam: 'limit',
    pageSize: 20,
    startPage: 1,
    totalPath: '',
    filters: [],
};

export function createEmptyConfig(): DynamicPageConfig {
    return {
        name: '',
        description: '',
        endpoint: {
            method: 'GET',
            url: '',
            headers: [],
            queryParams: [],
            body: '',
            useProxy: false,
        },
        rowsPath: '',
        layout: 'table',
        columns: [],
        card: { fieldKeys: [] },
        stats: [],
        controls: { ...DEFAULT_CONTROLS, filters: [] },
    };
}
