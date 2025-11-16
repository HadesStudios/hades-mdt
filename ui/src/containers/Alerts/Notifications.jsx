import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@mui/styles';

import Alert from './components/Alert';
import Moment from 'react-moment';
import { ErrorBoundary } from '../../components';

export default () => {
	const dispatch = useDispatch();
	const alerts = useSelector((state) => state.alerts.alerts);
	const showing = useSelector((state) => state.alerts.showing);
	const useStyles = makeStyles((theme) => ({
		container: {
			height: showing ? '60%' : '100%',
			width: '100%',
			overflowY: 'auto',
			overflowX: 'hidden',
			display: 'flex',
			position: 'relative',
		},
		main: {
			flex: 1,
		},
	// callsPanel removed per UX request (previously added a dark box shadow)
		callItem: {
			padding: '6px 8px',
			borderBottom: `1px solid ${theme.palette.divider}`,
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
		},
	}));
	const classes = useStyles();

	const onReset = () => {
		dispatch({
			type: 'RESET_ALERTS',
		});
	};

	return (
		<div className={classes.container}>
			<div className={classes.main}>
				<ErrorBoundary mini onRefresh={onReset}>
					<>
						{Boolean(alerts) &&
							alerts
								.sort((a, b) => b.time - a.time)
								.filter((a) => a.onScreen || (showing && a != null))
								.map((alert, k) => {
									return <Alert key={`em-alert-${alert.id}`} alert={alert} />;
								})}
					</>
				</ErrorBoundary>
			</div>
			{/* Active Calls panel removed per UX request */}
		</div>
	);
};
