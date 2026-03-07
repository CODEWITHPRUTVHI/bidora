import Head from 'next/head';

interface SchemaProps {
    data: any;
}

export default function Schema({ data }: SchemaProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
