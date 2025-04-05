import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../lib/api';

interface Product {
  id: string;
  name: string;
  description: string;
  usage_instructions: string;
  frequency_per_day: number;
  duration_days: number;
}

export default function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    usage_instructions: '',
    frequency_per_day: 3,
    duration_days: 30
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.getAll();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        usage_instructions: product.usage_instructions,
        frequency_per_day: product.frequency_per_day,
        duration_days: product.duration_days
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        usage_instructions: '',
        frequency_per_day: 3,
        duration_days: 30
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editingProduct) {
        await api.products.update(editingProduct.id, formData);
        enqueueSnackbar('Produit mis à jour avec succès', { variant: 'success' });
      } else {
        await api.products.create(formData);
        enqueueSnackbar('Produit créé avec succès', { variant: 'success' });
      }
      handleCloseDialog();
      loadProducts();
    } catch (err: any) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        setLoading(true);
        await api.products.delete(id);
        enqueueSnackbar('Produit supprimé avec succès', { variant: 'success' });
        loadProducts();
      } catch (err: any) {
        enqueueSnackbar(err.message, { variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestion des Produits
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Produit
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Instructions</TableCell>
              <TableCell>Fréquence</TableCell>
              <TableCell>Durée (jours)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.usage_instructions}</TableCell>
                <TableCell>{product.frequency_per_day}x par jour</TableCell>
                <TableCell>{product.duration_days} jours</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(product)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(product.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Nom"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <TextField
              label="Instructions d'utilisation"
              value={formData.usage_instructions}
              onChange={(e) => setFormData({ ...formData, usage_instructions: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Fréquence par jour</InputLabel>
              <Select
                value={formData.frequency_per_day}
                onChange={(e) => setFormData({ ...formData, frequency_per_day: Number(e.target.value) })}
                label="Fréquence par jour"
              >
                <MenuItem value={1}>1x par jour</MenuItem>
                <MenuItem value={2}>2x par jour</MenuItem>
                <MenuItem value={3}>3x par jour</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Durée (jours)"
              type="number"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {editingProduct ? 'Mettre à jour' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
