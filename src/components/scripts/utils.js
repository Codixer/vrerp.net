
export const pick = (obj, keys) => keys.reduce((val, key) => { 
    if (obj[key]) {
        val[key] = obj[key]; 
    }
    return val; 
}, {} );


export const get = (obj, key) => 
    (Array.isArray(key) ? key : key.split('.')).reduce((val, key) => val === undefined ? undefined : val[key], obj);

// https://stackoverflow.com/questions/32216383/in-react-how-do-i-detect-if-my-component-is-rendering-from-the-client-or-the-se
export const clientSide = !!(
    (typeof window !== 'undefined' &&
    window.document && window.document.createElement)
);

export const hasRole = (user, role) => (user && user.roles && user.roles.includes(role));

export const siteUrl = clientSide ? `${ window.location.protocol }//${ window.location.host }/` : process.env.SERVER_URL;

export const getDescription = (s) => s ? s.split('\n').join(' ').substr(0,300) : null;

export const getDiscordRedirectUrl = (apiUrl, redirectUrl) => 
    `https://discord.com/api/oauth2/authorize?client_id=1087160580990832741&redirect_uri=` +
    (`${ siteUrl }api/discord/${ apiUrl }`.replace(/\//g, '%2F')) +
    `&response_type=code&scope=identify` +
    (redirectUrl ? `&state=${ encodeURI(redirectUrl) }` : '');

export const plural = (num, str) => num > 1 ? `${ str }s` : str;

export const formatDate = (date) => (date instanceof Date) ? date.toLocaleDateString() : new Date(date).toLocaleDateString();

export const formatTime = (date) => new Date(date).toLocaleTimeString('en-us', { minute:"numeric", hour: "numeric"} );

export const addParameters = (url, parameters) => Object.keys(parameters).reduce((url, item) => {
    return parameters[item] ? `${ url }${(url.indexOf('?') === -1) ? '?' : '&'}${item}=${ encodeURIComponent(parameters[item]) }` : url;
}, url);
