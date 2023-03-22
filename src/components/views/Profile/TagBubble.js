import { h } from 'preact';
import classNames from 'classnames';
import style from './TagBubble.css';

export const TagBubble = ({ value, selected, onClick, ...rest }) => {
    const text = (!!value) && (value.constructor === Object) ? value.display : value;
    return (<div className={ classNames('bubble', { bubbleSelectable: onClick, bubbleSelected: selected }) } onClick={ onClick } value={ value } { ...rest }>{ text }</div>);
}

export const tagIterator = (tag) => {
    if (!tag) {
        return [];
    }
    return (Array.isArray(tag)) ? tag : [tag];
};
