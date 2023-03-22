import { h } from 'preact';
import Downshift, { useCombobox, useMultipleSelection } from 'downshift'
import { Button, Input, List } from '@dracula/dracula-ui';
import classNames from 'classnames';

import { useMemo } from 'react';
import { useState } from 'preact/hooks';

import style from './MultipleComboBox.css';

function getFilteredItems(items, selectedItems, inputValue) {
    const lowerCasedInputValue = inputValue.toLowerCase()
    return items.filter(function filterBook(item) {
        return (
            !selectedItems.includes(item) && (item.toLowerCase().includes(lowerCasedInputValue))
        )
    })
}

const MultipleComboBox = ({ items, initialSelectedItems = [], updatedItems, children }) => {
    const [inputValue, setInputValue] = useState('')
    const [selectedItems, setSelectedItems] = useState(initialSelectedItems)
    const shownItems = useMemo(() => getFilteredItems(items, selectedItems, inputValue),
        [selectedItems, inputValue],
    );
    const Render = children;
    // console.log('selectedItems', selectedItems);
    const {
        getSelectedItemProps,
        getDropdownProps,
        addSelectedItem,
        removeSelectedItem,
    } = useMultipleSelection({
        selectedItems,
        onStateChange({selectedItems: newSelectedItems, type}) {
            switch (type) {
            case useMultipleSelection.stateChangeTypes
                .SelectedItemKeyDownBackspace:
            case useMultipleSelection.stateChangeTypes.SelectedItemKeyDownDelete:
            case useMultipleSelection.stateChangeTypes.DropdownKeyDownBackspace:
            case useMultipleSelection.stateChangeTypes.FunctionRemoveSelectedItem:
                setSelectedItems(newSelectedItems);
                if (updatedItems) {
                    updatedItems(newSelectedItems);
                }
                setInputValue('');
                break
            default:
                break
            }
        },
    })
    const {
        isOpen,
        getToggleButtonProps,
        getLabelProps,
        getMenuProps,
        getInputProps,
        getComboboxProps,
        highlightedIndex,
        getItemProps,
        selectedItem,
    } = useCombobox({
        items: shownItems,
        itemToString(item) {
            return item;
        },
        defaultHighlightedIndex: 0, // after selection, highlight the first item.
        selectedItem: null,
        stateReducer(state, actionAndChanges) {
            const {changes, type} = actionAndChanges;
            switch (type) {
            case useCombobox.stateChangeTypes.InputKeyDownEnter:
            case useCombobox.stateChangeTypes.ItemClick:
            case useCombobox.stateChangeTypes.InputBlur:
            case useCombobox.stateChangeTypes.InputChange:
                return {
                    ...changes,
                    ...(changes.selectedItem && {isOpen: true, highlightedIndex: 0}),
                }
            default:
                return changes
            }
        },
        onStateChange({
            inputValue: newInputValue,
            type,
            selectedItem: newSelectedItem,
        }) {
            switch (type) {
            case useCombobox.stateChangeTypes.InputKeyDownEnter:
            case useCombobox.stateChangeTypes.ItemClick:
                setSelectedItems([...selectedItems, (newSelectedItem ? newSelectedItem : inputValue)])
                if (updatedItems) {
                    updatedItems([...selectedItems, (newSelectedItem ? newSelectedItem : inputValue)]);
                }
                setInputValue('');
                break;

            case useCombobox.stateChangeTypes.InputChange:
                setInputValue(newInputValue)
                break
            default:
                break
            }
        },
    })

    return (
        <div className="w-[592px]">
            <div className="flex flex-col gap-1">
                <label className="w-fit" {...getLabelProps()}>
                Search and filter:
                </label>
                <div className="shadow-sm bg-white inline-flex gap-2 items-center flex-wrap p-1.5">
                    {selectedItems.map(function renderSelectedItem(
                        selectedItemForRender,
                        index,
                    ) {
                        return (
                            <span
                                className="bg-gray-100 rounded-md px-1 focus:bg-red-400"
                                key={`selected-item-${index}`}
                                {...getSelectedItemProps({
                                    selectedItem: selectedItemForRender,
                                    index,
                                })}
                            >
                                {selectedItemForRender}
                                <span
                                    className="px-1 cursor-pointer"
                                    onClick={e => {
                                        e.stopPropagation()
                                        removeSelectedItem(selectedItemForRender)
                                    }}
                                >
                                    &#10005;
                                </span>
                            </span>
                        )
                    })}
                    <div className="flex gap-0.5 grow" {...getComboboxProps()}>
                        <Input
                            color='purple'
                            placeholder="type to search"
                            className="combobox-text"
                            value={ inputValue }
                            {...getInputProps(getDropdownProps({preventKeyAction: isOpen}))}
                        />
                        <Button
                            color='purple'
                            variant='outline'
                            aria-label="toggle menu"
                            {...getToggleButtonProps()}
                        >
                            &#8595;
                        </Button>
                    </div>
                </div>
            </div>
            <List
                {...getMenuProps()}
                className="combobox-panel"
            >
                {isOpen &&
                    shownItems.map((item, index) => (
                        <li className={ classNames('drac-text', {
                            'drac-text-white': highlightedIndex === index,
                            'drac-text-purple': highlightedIndex !== index,
                            'font-bold': selectedItem === item,
                        }) }
                        key={`${item}${index}`}
                        {...getItemProps({item, index})}
                        >
                            <span>{item}</span>
                            <span className="text-sm text-gray-700">{item.author}</span>
                        </li>
                    ))}
            </List>
            <br />
            <Render selectedItems={ selectedItems } />
        </div>
    )
};


export default MultipleComboBox;
