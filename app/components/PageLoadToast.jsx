'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-toastify';

const PageLoadToast = () => {
    const pathname = usePathname();
    const lastPath = useRef(null);

    useLayoutEffect(() => {
        if (lastPath.current === pathname) return;
        lastPath.current = pathname;
        toast.info('Page refreshed', { toastId: 'page-load-toast' });
    }, [pathname]);

    return null;
};

export default PageLoadToast;
