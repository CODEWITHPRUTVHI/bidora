// Global type declarations for third-party scripts loaded via <script> tags

interface GoogleAccountsId {
    initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        ux_mode?: 'popup' | 'redirect';
    }) => void;
    prompt: (callback?: (notification: {
        isNotDisplayed: () => boolean;
        isSkippedMoment: () => boolean;
    }) => void) => void;
    renderButton: (element: HTMLElement, options: {
        type?: string;
        size?: string;
        width?: number;
    }) => void;
}

interface Window {
    google?: {
        accounts: {
            id: GoogleAccountsId;
        };
    };
}
