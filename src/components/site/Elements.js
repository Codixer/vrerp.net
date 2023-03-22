import { h } from 'preact';
import classNames from 'classnames';
import { useStores } from 'pullstate';
import { useState, useMemo, useEffect, useCallback, useRef } from 'preact/hooks';

import style from './Elements.css';
import { Button as DraculaButton } from '@dracula/dracula-ui';
import { Input, Text } from '@dracula/dracula-ui';
import { getImageURL } from '../../shared.js';

export const Link = ({ href, children, ...rest }) => (<a href={ href } { ...rest }>{ children }</a>)

export const Checkbox = ({ label, value, onChange, children }) => {
    return (
        <div>
            <label>
                <input type="checkbox" checked={value} onChange={onChange} />
                {label}
            </label>
            { children }
        </div>
    );
};

export const Button = ({ children, color, ...rest }) => {
    return (
        <DraculaButton p="sm" color={ color || 'purple' } { ...rest }>{ children }</DraculaButton>
    );
};

export const outlinedButton = 'drac-btn drac-bg-purple drac-btn-outline drac-text-purple';

export const Loading = () => {
    return (
        <div>Loading...</div>
    );
};

export const InputBox = ({ children, type, value, onChange, error, ...rest }) => {
    const [ val, setVal ] = useState(value);
    const handleChange = useCallback((evt) => {
        setVal(evt.target.value);
        if (onChange) {
            onChange(evt);
        }
    });
    return (
        <div className="drac-p-sm">
            <div>{ children }</div>
            <Input type={ type } color="purple" value={ val } onChange={ handleChange } { ...rest } />
            {
                error && <Text color="red">{ error }</Text>
            }
        </div>
    );
};

// better version: https://github.com/matthewmaribojoc/vue-3-skeleton-loader-example/blob/main/src/components/ProfileCardSkeleton.vue
export const SuspenseBar = ({ height, finished, load, children }) => {
    const [ loading, setLoading ] = useState(!finished);
    useEffect(async() => {
        if (!finished) {
            setLoading(true);
            if (!load) {
                return;
            }
            await load();
        }
        setLoading(false);
    }, [ finished ]);
    return loading ? <div style={{ height, minHeight: '400px' }} className='skeleton-main'></div> : children;
};

export const DynamicLink = ({ onClick, children, className = '' }) => {
    return (<div className={ `dynamiclink drac-text-purple ${ className }` } onClick={ onClick } >{ children }</div> )
};

export const Error = ({ children }) => {
    return (
        <div className='error'>{ children }</div>
    )
};

export const InputArea = ({ value, className, ...rest }) => {
    return (
        <div>
            <textarea className={ `drac-input drac-input-purple drac-text-purple inputarea ${ className ? className : '' }` } { ...rest } >{ value }</textarea>
        </div>
    )
};

export const Modal = ({ show, consent = false, closable = true, onClose, children, ...rest }) => {
    const backgroundRef = useRef(null);
    const checkClose = useCallback((e) => {
        if (!closable) {
            return false;
        }
        if (e && e.target && backgroundRef && backgroundRef.current && backgroundRef.current === e.target) {
            onClose();
        }
    }, [ show, closable ]);
    return (<div className={ classNames('modal', { 'modal-show': show, 'modal-consent': consent }) } { ...rest } ref={ backgroundRef } onClick={ checkClose } >{ children }</div>);
};

export const Image = ({ file, size, ...rest }) => {
    return <img src={ getImageURL(file, size) } { ...rest } />
};
