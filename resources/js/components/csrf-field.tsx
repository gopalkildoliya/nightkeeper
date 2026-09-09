import { usePage } from '@inertiajs/react';

export function CsrfField() {
    const token = usePage().props.csrf_token;

    return <input type="hidden" name="_token" value={token} />;
}
