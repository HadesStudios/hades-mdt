import React, { useEffect, useState } from 'react';
import { TextField, MenuItem } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { Modal } from '../../../../components';

const useStyles = makeStyles((theme) => ({
	editorField: {
		marginBottom: 10,
	},
}));

export const EvidenceTypes = [
	{
		label: 'Photo',
		value: 'photo',
		style: {
			backgroundColor: '#9542f5',
		},
	},
	{
		label: 'Casing',
		value: 'casing',
		style: {
			backgroundColor: '#969696',
		},
	},
	{
		label: 'Projectile',
		value: 'projectile',
		style: {
			backgroundColor: '#de4628',
			color: '#ffffff',
		},
	},
	{
		label: 'Weapon',
		value: 'weapon',
		style: {
			backgroundColor: '#8f032b',
		},
	},
	{
		label: 'Paint Fragment',
		value: 'fragment',
		style: {
			backgroundColor: '#038f11',
		},
	},
	{
		label: 'Other',
		value: 'other',
		style: {
			backgroundColor: '#1eadd9',
		},
	},
	{
		label: 'Evidence Locker',
		value: 'evidence_locker',
		style: {
			backgroundColor: '#1e90ff',
			color: '#ffffff',
		},
	},
];

const initalState = {
	_id: '',
	type: '',
	label: '',
	value: '',
};

export default ({ open, existing = null, onSubmit, onClose }) => {
	const classes = useStyles();

	const [state, setState] = useState({
		_id: Boolean(existing) ? existing._id : null,
		type: Boolean(existing) ? existing.type : '',
		label: Boolean(existing) ? existing.label : '',
		value: Boolean(existing) ? existing.value : '',
	});

	useEffect(() => {
		setState({
			...state,
			...existing,
		});
	}, [existing]);

	useEffect(() => {
		// if user selects Evidence Locker ensure label defaults to a sensible value
		if (state.type === 'evidence_locker' && (!state.label || state.label === '')) {
			setState((s) => ({ ...s, label: 'Evidence Locker' }));
		}
	}, [state.type]);

	const internalSubmit = (e) => {
		e.preventDefault();
		onSubmit(state);
		setState({ ...initalState });
	};

	const onChange = (e) => {
		setState({
			...state,
			[e.target.name]: e.target.value,
		});
	};

	return (
		<Modal
			open={open}
			maxWidth="sm"
			title={existing ? 'Edit Evidence' : 'Add New Evidence'}
			submitLang={existing ? 'Edit' : 'Create'}
			onSubmit={internalSubmit}
			onClose={onClose}
		>
			<TextField
				required
				select
				fullWidth
				name="type"
				label="Type"
				className={classes.editorField}
				value={state.type}
				onChange={onChange}
			>
				{EvidenceTypes.map((option) => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</TextField>
			<TextField
				required
				fullWidth
				name="label"
				label="Label"
				className={classes.editorField}
				value={state.label}
				onChange={onChange}
			/>
			<TextField
				required
				fullWidth
				name="value"
				label={state.type === 'evidence_locker' ? 'Locker ID' : 'Evidence Identifier'}
				className={classes.editorField}
				value={state.value}
				onChange={onChange}
			/>
		</Modal>
	);
};
