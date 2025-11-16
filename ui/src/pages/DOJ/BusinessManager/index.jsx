import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@mui/styles';
import {
	Grid,
	TextField,
	MenuItem,
	Button,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	InputAdornment,
	Alert,
	Tooltip,
	Typography,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Nui from '../../../util/Nui';

const useStyles = makeStyles((theme) => ({
	wrapper: {
		padding: 20,
		height: '100%',
		overflow: 'auto',
	},
	headerSection: {
		marginBottom: 20,
	},
	filterSection: {
		marginBottom: 20,
		padding: 15,
		background: theme.palette.secondary.dark,
		borderRadius: 4,
	},
	businessCard: {
		padding: 15,
		marginBottom: 10,
		background: theme.palette.secondary.dark,
		'&:hover': {
			background: theme.palette.secondary.main,
		},
	},
	activeChip: {
		background: theme.palette.success.main,
		color: theme.palette.text.main,
	},
	inactiveChip: {
		background: theme.palette.error.main,
		color: theme.palette.text.main,
	},
	dialogPaper: {
		minWidth: 500,
		background: theme.palette.secondary.dark,
	},
	searchSection: {
		marginTop: 15,
		padding: 10,
		background: theme.palette.secondary.light,
		borderRadius: 4,
	},
}));

export default function BusinessManager() {
	const classes = useStyles();
	const dispatch = useDispatch();

	const showAlert = (message, type = 'error') => {
		dispatch({
			type: 'ADD_ALERT',
			payload: {
				message: message,
				type: type,
				time: Date.now(),
			},
		});
	};

	const [businesses, setBusinesses] = useState([]);
	const [filteredBusinesses, setFilteredBusinesses] = useState([]);
	const [filter, setFilter] = useState('all');
	const [searchTerm, setSearchTerm] = useState('');
	
	// Dialog states
	const [sellDialogOpen, setSellDialogOpen] = useState(false);
	const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
	const [selectedBusiness, setSelectedBusiness] = useState(null);
	const [salePrice, setSalePrice] = useState('');
	const [buyerSearch, setBuyerSearch] = useState('');
	const [searchResults, setSearchResults] = useState([]);
	const [selectedBuyer, setSelectedBuyer] = useState(null);

	useEffect(() => {
		fetchBusinesses();
	}, []);

	useEffect(() => {
		filterBusinesses();
	}, [filter, searchTerm, businesses]);

	const fetchBusinesses = async () => {
		try {
			console.log('[Business Manager] Fetching businesses...');
			const res = await Nui.send('GetAllBusinesses', {});
			console.log('[Business Manager] Response:', res);
			
			if (res && Array.isArray(res)) {
				console.log('[Business Manager] Received', res.length, 'businesses');
				setBusinesses(res);
			} else if (res === false) {
				console.error('[Business Manager] Permission denied or error');
				setBusinesses([]);
				showAlert('Permission denied or error loading businesses', 'error');
			} else {
				console.warn('[Business Manager] Invalid response format:', res);
				setBusinesses([]);
			}
		} catch (err) {
			console.error('[Business Manager] Error:', err);
			setBusinesses([]);
			showAlert('Failed to load businesses');
		}
	};

	const filterBusinesses = () => {
		if (!Array.isArray(businesses)) {
			setFilteredBusinesses([]);
			return;
		}

		let filtered = [...businesses];

		if (filter === 'owned') {
			filtered = filtered.filter(b => b.owner);
		} else if (filter === 'available') {
			filtered = filtered.filter(b => !b.owner);
		} else if (filter === 'restaurant') {
			filtered = filtered.filter(b => b.type === 'restaurant');
		} else if (filter === 'mechanic') {
			filtered = filtered.filter(b => b.type === 'mechanic');
		} else if (filter === 'business') {
			filtered = filtered.filter(b => b.type === 'business');
		}

		if (searchTerm) {
			filtered = filtered.filter(b => 
				b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(b.owner && b.owner.name.toLowerCase().includes(searchTerm.toLowerCase()))
			);
		}

		setFilteredBusinesses(filtered);
	};

	const searchPeople = async (query) => {
		if (!query || query.length < 2) {
			setSearchResults([]);
			return;
		}

		try {
			const res = await Nui.send('Search', {
				type: 'person',
				term: query,
			});
			if (res && Array.isArray(res)) {
				setSearchResults(res);
			} else {
				setSearchResults([]);
			}
		} catch (err) {
			console.error(err);
			setSearchResults([]);
		}
	};

	const handleSellBusiness = async () => {
		if (!selectedBusiness || !selectedBuyer || !salePrice) {
			showAlert('Please fill in all fields');
			return;
		}

		const price = parseInt(salePrice);
		if (isNaN(price) || price < 1) {
			showAlert('Price must be at least $1');
			return;
		}

		try {
			const res = await Nui.send('SellBusiness', {
				businessId: selectedBusiness.id,
				buyerSID: selectedBuyer.SID,
				price: price,
			});

			if (res && res.success) {
				showAlert(`Business sale initiated! Bill sent to ${selectedBuyer.First} ${selectedBuyer.Last}`, 'success');
				setSellDialogOpen(false);
				resetSellDialog();
				fetchBusinesses();
			} else {
				showAlert(res?.message || 'Failed to sell business');
			}
		} catch (err) {
			console.error(err);
			showAlert('Failed to sell business');
		}
	};

	const handleRevokeBusiness = async () => {
		if (!selectedBusiness) return;

		try {
			const res = await Nui.send('RevokeBusinessOwnership', {
				businessId: selectedBusiness.id,
			});

			if (res && res.success) {
				showAlert('Business ownership revoked successfully', 'success');
				setRevokeDialogOpen(false);
				setSelectedBusiness(null);
				fetchBusinesses();
			} else {
				showAlert(res?.message || 'Failed to revoke ownership');
			}
		} catch (err) {
			console.error(err);
			showAlert('Failed to revoke ownership');
		}
	};

	const resetSellDialog = () => {
		setSalePrice('');
		setBuyerSearch('');
		setSearchResults([]);
		setSelectedBuyer(null);
		setSelectedBusiness(null);
	};

	const openSellDialog = (business) => {
		setSelectedBusiness(business);
		setSellDialogOpen(true);
	};

	const openRevokeDialog = (business) => {
		setSelectedBusiness(business);
		setRevokeDialogOpen(true);
	};

	return (
		<div className={classes.wrapper}>
			<Grid container spacing={2}>
				<Grid item xs={12} className={classes.headerSection}>
					<Typography variant="h4">
						<FontAwesomeIcon icon={['fas', 'building']} style={{ marginRight: 10 }} />
						Business Manager
					</Typography>
					<Typography variant="body2" color="textSecondary">
						Manage business ownership, sales, and activity
					</Typography>
				</Grid>

				<Grid item xs={12} className={classes.filterSection}>
					<Grid container spacing={2} alignItems="center">
						<Grid item xs={12} sm={4}>
							<TextField
								fullWidth
								select
								label="Filter Businesses"
								value={filter}
								onChange={(e) => setFilter(e.target.value)}
								variant="outlined"
								size="small"
							>
								<MenuItem value="all">All Businesses</MenuItem>
								<MenuItem value="owned">Owned</MenuItem>
								<MenuItem value="available">Available for Sale</MenuItem>
								<MenuItem value="restaurant">Restaurants</MenuItem>
								<MenuItem value="mechanic">Mechanics</MenuItem>
								<MenuItem value="business">Other Businesses</MenuItem>
							</TextField>
						</Grid>
						<Grid item xs={12} sm={8}>
							<TextField
								fullWidth
								label="Search by Business or Owner Name"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								variant="outlined"
								size="small"
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<FontAwesomeIcon icon={['fas', 'magnifying-glass']} />
										</InputAdornment>
									),
								}}
							/>
						</Grid>
					</Grid>
				</Grid>

				<Grid item xs={12}>
					<TableContainer component={Paper}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Business Name</TableCell>
									<TableCell>Type</TableCell>
									<TableCell>Owner</TableCell>
									<TableCell>Status</TableCell>
									<TableCell>Employees</TableCell>
									<TableCell align="right">Actions</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{filteredBusinesses.length > 0 ? (
									filteredBusinesses.map((business) => (
										<TableRow key={business.id}>
											<TableCell>
												<strong>{business.name}</strong>
											</TableCell>
											<TableCell>
												<Chip
													label={business.type.charAt(0).toUpperCase() + business.type.slice(1)}
													size="small"
													icon={<FontAwesomeIcon icon={['fas', 
														business.type === 'restaurant' ? 'utensils' : 
														business.type === 'mechanic' ? 'wrench' : 
														'briefcase'
													]} />}
												/>
											</TableCell>
											<TableCell>
												{business.owner ? (
													<div>
														<div>{business.owner.name}</div>
														<Typography variant="caption" color="textSecondary">
															SID: {business.owner.sid}
														</Typography>
													</div>
												) : (
													<Chip label="Available" size="small" color="default" />
												)}
											</TableCell>
											<TableCell>
												<Chip
													label={business.active ? 'Active' : 'Inactive'}
													size="small"
													className={business.active ? classes.activeChip : classes.inactiveChip}
												/>
											</TableCell>
											<TableCell>
												<Chip
													label={`${business.employees || 0} Employees`}
													size="small"
													icon={<FontAwesomeIcon icon={['fas', 'users']} />}
												/>
											</TableCell>
											<TableCell align="right">
												<Tooltip title="Sell Business">
													<IconButton
														size="small"
														color="primary"
														onClick={() => openSellDialog(business)}
													>
														<FontAwesomeIcon icon={['fas', 'dollar-sign']} />
													</IconButton>
												</Tooltip>
												{business.owner && (
													<Tooltip title="Revoke Ownership">
														<IconButton
															size="small"
															color="error"
															onClick={() => openRevokeDialog(business)}
														>
															<FontAwesomeIcon icon={['fas', 'user-minus']} />
														</IconButton>
													</Tooltip>
												)}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={6} align="center">
											<Typography variant="body2" color="textSecondary">
												No businesses found
											</Typography>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</Grid>
			</Grid>

			{/* Sell Business Dialog */}
			<Dialog
				open={sellDialogOpen}
				onClose={() => {
					setSellDialogOpen(false);
					resetSellDialog();
				}}
				classes={{ paper: classes.dialogPaper }}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					<FontAwesomeIcon icon={['fas', 'dollar-sign']} style={{ marginRight: 10 }} />
					Sell Business: {selectedBusiness?.name}
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<Alert severity="info">
								The buyer will receive a bill on their phone to complete the purchase.
							</Alert>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Sale Price"
								type="number"
								value={salePrice}
								onChange={(e) => setSalePrice(e.target.value)}
								variant="outlined"
								InputProps={{
									startAdornment: <InputAdornment position="start">$</InputAdornment>,
								}}
								helperText="Minimum: $1"
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Search Buyer (Name or State ID)"
								value={buyerSearch}
								onChange={(e) => {
									setBuyerSearch(e.target.value);
									searchPeople(e.target.value);
								}}
								variant="outlined"
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<FontAwesomeIcon icon={['fas', 'magnifying-glass']} />
										</InputAdornment>
									),
								}}
							/>
						</Grid>
						{searchResults.length > 0 && (
							<Grid item xs={12} className={classes.searchSection}>
								<Typography variant="subtitle2" gutterBottom>
									Select Buyer:
								</Typography>
								{searchResults.map((person) => (
									<Paper
										key={person.SID}
										className={classes.businessCard}
										style={{
											cursor: 'pointer',
											border: selectedBuyer?.SID === person.SID ? '2px solid #2196f3' : 'none',
										}}
										onClick={() => setSelectedBuyer(person)}
									>
										<Typography variant="body1">
											{person.First} {person.Last}
										</Typography>
										<Typography variant="caption" color="textSecondary">
											State ID: {person.SID} | Phone: {person.Phone || 'N/A'}
										</Typography>
									</Paper>
								))}
							</Grid>
						)}
						{selectedBuyer && (
							<Grid item xs={12}>
								<Alert severity="success">
									Selected: {selectedBuyer.First} {selectedBuyer.Last} (SID: {selectedBuyer.SID})
								</Alert>
							</Grid>
						)}
					</Grid>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setSellDialogOpen(false);
							resetSellDialog();
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSellBusiness}
						color="primary"
						variant="contained"
						disabled={!selectedBuyer || !salePrice || parseInt(salePrice) < 1}
					>
						Send Bill & Transfer Ownership
					</Button>
				</DialogActions>
			</Dialog>

			{/* Revoke Ownership Dialog */}
			<Dialog
				open={revokeDialogOpen}
				onClose={() => {
					setRevokeDialogOpen(false);
					setSelectedBusiness(null);
				}}
				classes={{ paper: classes.dialogPaper }}
			>
				<DialogTitle>
					<FontAwesomeIcon icon={['fas', 'user-minus']} style={{ marginRight: 10 }} />
					Revoke Business Ownership
				</DialogTitle>
				<DialogContent>
					<Alert severity="warning" style={{ marginBottom: 15 }}>
						This will remove the owner from {selectedBusiness?.name}. All employees will remain employed.
					</Alert>
					<Typography variant="body1">
						Current Owner: <strong>{selectedBusiness?.owner?.name}</strong>
					</Typography>
					<Typography variant="body2" color="textSecondary">
						SID: {selectedBusiness?.owner?.sid}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setRevokeDialogOpen(false);
							setSelectedBusiness(null);
						}}
					>
						Cancel
					</Button>
					<Button onClick={handleRevokeBusiness} color="error" variant="contained">
						Revoke Ownership
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
