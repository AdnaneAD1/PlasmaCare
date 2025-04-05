import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNotifications } from '../../lib/notifications';
import api from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateToken } from '../../notifications/firebase';

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface ProductReminder {
  id: string;
  reminder_time: string;
  start_date: string;
  end_date: string;
  products: {
    name: string;
    usage_instructions: string;
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<ProductReminder[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const notificationsApi = useNotifications();

  useEffect(() => {
    generateToken();
    loadNotifications();
    loadReminders();
    checkPushPermission();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadReminders = async () => {
    try {
      const data = await api.notifications.getProductReminders();
      setReminders(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const checkPushPermission = () => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setLoading(true);
      await notificationsApi.subscribeToPushNotifications();
      setPushEnabled(true);
      enqueueSnackbar('Notifications activées avec succès', { variant: 'success' });
    } catch (error: any) {
      console.error('Erreur lors de l\'activation des notifications:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      setPushEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      loadNotifications();
    } catch (err: any) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Notifications
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={pushEnabled}
              onChange={handleEnableNotifications}
              disabled={loading}
            />
          }
          label="Activer les notifications push"
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Rappels de Produits
          </Typography>
          <List>
            {reminders.map((reminder) => (
              <ListItem key={reminder.id}>
                <ListItemIcon>
                  <NotificationsActiveIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={reminder.products.name}
                  secondary={`${reminder.products.usage_instructions} - À prendre à ${reminder.reminder_time.slice(0, 5)}`}
                />
                <Chip
                  label={`Jusqu'au ${new Date(reminder.end_date).toLocaleDateString()}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </ListItem>
            ))}
            {reminders.length === 0 && (
              <ListItem>
                <ListItemText
                  secondary="Aucun rappel de produit actif"
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Paper>

      <Paper>
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Historique des Notifications
          </Typography>
          <List>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                secondaryAction={
                  !notification.read && (
                    <IconButton
                      edge="end"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <CheckIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemIcon>
                  {notification.read ? (
                    <NotificationsOffIcon color="disabled" />
                  ) : (
                    <NotificationsIcon color="primary" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <>
                      {notification.body}
                      <br />
                      <Typography variant="caption" color="textSecondary">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
            {notifications.length === 0 && (
              <ListItem>
                <ListItemText
                  secondary="Aucune notification"
                />
              </ListItem>
            )}
          </List>
        </Box>
      </Paper>
    </Box>
  );
}
