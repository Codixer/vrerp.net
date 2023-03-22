import { useEffect } from 'preact/hooks'; 

export const fetchData = async(store, url, postData = null, lambda = null, errorLambda = null) => {
    const fetchParams = postData ? {
        method: 'POST',
        body: JSON.stringify(postData),        
    } : null;
    const response = await fetch(url, fetchParams);
    const data = await response.json();
    if (data.error) {
        if (errorLambda) {
            errorLambda(data);
        }
        return data;
    }
    store.update(s => {
        if (lambda) {
            lambda(s, data.data);
        } else {
            Object.keys(data.data).forEach((key) => {
                s[key] = data.data[key];
            });
        }
    });
    return data.data;
};

// multi-store update
export const fetchStore = async(url, postData = null, updates = [], errorLambda = null) => {
    const fetchParams = postData ? {
        method: 'POST',
        body: JSON.stringify(postData),
    } : null;
    const response = await fetch(url, fetchParams);
    const data = await response.json();
    if (data.error) {
        if (errorLambda) {
            errorLambda(data);
        }
        return data;
    }
    if (!Array.isArray(updates)) {
        updates = [ updates ];
    }
    updates.forEach((item) => {
        const [store, lambda] = item;
        store.update(s => {
            if (lambda) {
                lambda(s, data.data);
            } else {
                Object.keys(data.data).forEach((key) => {
                    s[key] = data.data[key];
                });
            }
        });
    });
    return data.data;
}

export const fetchPost = async(url, postData) => {
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(postData),
    });
    const data = await response.json();
    if (data.error) {
        return data;
    }
    return data.data;
};

export const fetchProfile = async(id, profileStore, update = null, updateError = null) => 
    fetchData(profileStore, `/api/profiles/${ id }`, update, (s, data) => {
        s.profiles[id] = data.profile;
        s.files = { ...s.files, ...data.files };
        s.fantasies = { ...s.fantasies, ...data.fantasies };
    }, updateError);

export const fetchProfileList = async(ids, profileStore, assetStore) =>
    fetchStore('/api/profilelist', { ids }, [[ profileStore, updateProfile() ], [ assetStore, updateAssets ]]);


export const deleteData = async(url) => {
    const response = await fetch(url, {
        method: 'DELETE',
    });
    const data = await response.json();
    return data;
}

export const deleteDataAndUpdateStore = async(store, url, lambda = null, errorLambda = null) => {
    const data = await deleteData(url);
    if (data.error) {
        if (errorLambda) {
            errorLambda(data);
        }
        return data;
    }
    store.update(s => {
        if (lambda) {
            lambda(s, data.data);
        } else {
            Object.keys(data.data).forEach((key) => {
                s[key] = data.data[key];
            });
        }
    });
    return data.data;
}

export const updateProfile = (id) => (s, data) => {
    if (id) {
        s.profiles[id] = data.profile;
    }
    s.profiles = { ...s.profiles, ...data.profiles };
    if (data.files) {
        s.files = { ...s.files, ...data.files };
    }
    if (data.fantasies) {
        s.fantasies = { ...s.fantasies, ...data.fantasies };
    }
};

export const updateFiles = (s, data) => {
    if (data.files) {
        s.files = { ...s.files, ...data.files };
    }
}

export const updateAssets = (s, data) => {
    if (data.assets) {
        s.assets = { ...s.assets, ...data.assets };
    }
    if (data.creators) {
        s.creators = { ...s.creators, ...data.creators };
    }
    if (data.list) {
        s.assetList = s.assetList.concat(data.list);
        s.assetList = s.assetList
            .filter((x, i) => i === s.assetList.indexOf(x))
            .sort((a,b) => (BigInt(a) < (BigInt(b)) ? 0 : -1));
    }
}

export const updateMedia = (s, data) => {
    if (data.list) {
        s.imageList = s.imageList.concat(data.list);
        s.imageList = s.imageList
            .filter((x, i) => i === s.imageList.indexOf(x))
            .sort((a,b) => (BigInt(a) < (BigInt(b)) ? 0 : -1));
    }
}

export const updateFeed = (s, data) => {
    s.matches = data.matches;
    s.invites = data.invites;
    s.loves = data.loves;
    s.invitePending = data.invitePending;
};

export const updateFantasyData = (id) => (s, data) => {
    if (id) {
        s.fantasies[id] = data.fantasy;
    } else {
        s.fantasies = { ...s.fantasies, ...data.fantasies };
    }
    if (data.fantasyList) {
        s.fantasyList = s.fantasyList.concat(data.fantasyList);
        // deduplicate array to handle the case of multiple parallel reads
        s.fantasyList = s.fantasyList
            .filter((x, i) => i === s.fantasyList.indexOf(x))
            .sort((a,b) => (BigInt(a) < (BigInt(b)) ? 0 : -1));
    }
    if (data.fantasyLikes) {
        s.fantasyLikes = { ...s.fantasyLikes, ...data.fantasyLikes };
    }
    if (data.files) {
        s.files = { ...s.files, ...data.files };
    }
};

export const updateDates = (s, data) => {
    s.dates = { ...s.dates, ...data.dates };
};
