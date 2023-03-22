import { h } from 'preact';
import classNames from 'classnames';
import React, {useCallback} from 'react'
import { useDropzone } from 'react-dropzone'
import { Badge } from '@dracula/dracula-ui';

import style from './FileUpload.css';
import { useState } from 'preact/hooks';

const uploadFile = async(file, body) => {
    const response = await fetch(`/api/files/${ file.name }`, { method: 'POST', body: JSON.stringify({ 'type': file.type, size: file.size, ...body }) });
    const data = await response.json();
    const { signedUrl, fid } = data.data;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(signedUrl, { method: 'PUT', body: file });
    return fid;
};

const FileUpload = ({ onUpload, className, children, category, parentId }) => {
    const [ uploading, setUploading ] = useState(false);
    const onDrop = useCallback(async(acceptedFiles) => {
        setUploading(true);
        const res = await Promise.all(acceptedFiles.map((f) => uploadFile(f, { category: category || 'profile', parentId })));
        await onUpload(res);
        setUploading(false);
    }, []);
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    return (
        <div className='drac-badge drac-bg-purple drac-badge-outline drac-text-purple drac-m-sm imageFrame'>
            <div {...getRootProps()} className={ classNames(className, 'fileUpload') }>
                <input {...getInputProps()} />
                {
                    isDragActive ? <p className='fileUpload'>Drop the files here ...</p> :
                        (uploading ? <p className='fileUpload'>Uploading ...</p> : children)
                }
            </div>
        </div>
    );
};

export default FileUpload;
