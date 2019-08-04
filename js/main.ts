declare var gtag: (command: string, id: string, config: object) => void;

namespace markb {
    const externalLinkQualifier: string = 'External Link: ';

    export function ready(callback: EventListener): void {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            callback(new Event('DOMContentLoaded'));
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    }

    function externalLinkClickHandler(e: Event): void {
        e.preventDefault();
        const link: HTMLElement = e.currentTarget as HTMLElement;
        const href: string = link.getAttribute('href');
        const title: string = link.getAttribute('title').substring(externalLinkQualifier.length);
        gtag('event', 'Click', {
            'event_category': 'External Link',
            'event_label': title,
            'transport_type': 'beacon',
            'event_callback': () => document.location.href = href
        });
    }

    export function init(): void {
        const e: Element[] = Array.prototype.slice.call(document.getElementsByClassName('e'));

        if (e.length) {
            const mt: string = String.fromCharCode(109, 97, 105, 108, 116, 111, 58);
            const v: string[] = '109#101#64#109#97#114#107#98#46#99#111#46#117#107'.split('#');
            const t: string = v.map(cc => String.fromCharCode(parseInt(cc, 10))).join('');
            const a: string = `<a href="${mt}${t}">${t}</a>`;
            e.forEach(el => el.innerHTML = a);
        }

        const externalLinks: Element[] =
           Array.prototype.slice.call(document.querySelectorAll(`a[title^="${externalLinkQualifier}"]`));

        externalLinks.forEach(link => link.addEventListener('click', externalLinkClickHandler));
    }
}

markb.ready(markb.init);
