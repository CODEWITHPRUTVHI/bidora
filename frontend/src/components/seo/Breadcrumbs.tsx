import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className="mb-8 overflow-x-auto scrollbar-hide">
            <ol className="flex items-center space-x-2 text-sm font-medium whitespace-nowrap">
                <li className="flex items-center">
                    <Link
                        href="/"
                        className="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                        <Home className="w-4 h-4" />
                        <span className="sr-only">Home</span>
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={item.href} className="flex items-center">
                        <ChevronRight className="w-4 h-4 text-gray-600 mx-1 flex-shrink-0" />
                        {index === items.length - 1 ? (
                            <span className="text-yellow-400 font-bold" aria-current="page">
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                href={item.href}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                {item.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
