import { Suspense } from 'react';
import InboxMain from './InboxMain';

export default function InboxPage() {
    return (
        <Suspense fallback={
            <div className="h-[calc(100vh-65px)] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <InboxMain />
        </Suspense>
    );
}
