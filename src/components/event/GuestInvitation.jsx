import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, TextField, CircularProgress, Divider, Card, CardContent, CardActions, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, IconButton, Alert, Snackbar } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const GuestInvitation = ({ eventId, event, guests, onGuestUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [invitationLink, setInvitationLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  useEffect(() => {
    if (event) {
      // Generate default email template
      const defaultSubject = `Invitation: ${event.title}`;
      const defaultTemplate = `
Dear [Guest Name],

You are cordially invited to ${event.title}!

Event Details:
- Date: ${format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')}
- Time: ${format(new Date(event.start_date), 'h:mm a')} to ${format(new Date(event.end_date), 'h:mm a')}
- Location: ${event.location}${event.address ? `, ${event.address}` : ''}
${event.city ? `${event.city}` : ''}${event.state ? `, ${event.state}` : ''}${event.zip_code ? ` ${event.zip_code}` : ''}

${event.description ? `Event Description: ${event.description}

` : ''}
Please RSVP by clicking the link below:
[Invitation Link]

We look forward to seeing you!

Best regards,
[Your Name]
`;

      setEmailSubject(defaultSubject);
      setEmailTemplate(defaultTemplate);
      
      // Generate invitation link
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/invitation/${eventId}?code=${generateInviteCode(eventId)}`;
      setInvitationLink(inviteLink);
    }
  }, [event, eventId]);

  const generateInviteCode = (eventId) => {
    // In a real app, this would generate a secure random code
    // For demo purposes, we'll use a simple hash of the event ID
    return btoa(`invite-${eventId}-${Date.now()}`).substring(0, 12);
  };

  const handleSelectAllGuests = () => {
    if (selectedGuests.length === guests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map(guest => guest.id));
    }
  };

  const handleSelectGuest = (guestId) => {
    if (selectedGuests.includes(guestId)) {
      setSelectedGuests(selectedGuests.filter(id => id !== guestId));
    } else {
      setSelectedGuests([...selectedGuests, guestId]);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast.success('Invitation link copied to clipboard');
  };

  const handleSendInvitations = async () => {
    if (selectedGuests.length === 0) {
      toast.error('Please select at least one guest');
      return;
    }

    setSending(true);
    try {
      // In a real application, this would send actual emails
      // For demo purposes, we'll just update the guest status in the database
      
      // Get the selected guests
      const selectedGuestsList = guests.filter(guest => selectedGuests.includes(guest.id));
      
      // Update each guest's invitation status
      for (const guest of selectedGuestsList) {
        const { error } = await supabase
          .from('event_guests')
          .update({
            invitation_sent: true,
            invitation_sent_at: new Date(),
            updated_at: new Date()
          })
          .eq('id', guest.id);
        
        if (error) throw error;
      }
      
      // Create invitation records
      const invitationRecords = selectedGuestsList.map(guest => ({
        event_id: eventId,
        guest_id: guest.id,
        sent_at: new Date(),
        email_subject: emailSubject,
        email_content: emailTemplate.replace('[Guest Name]', guest.name)
      }));
      
      const { error } = await supabase
        .from('event_invitations')
        .insert(invitationRecords);
      
      if (error) throw error;
      
      // Trigger parent component to refresh guest list
      if (onGuestUpdate) {
        onGuestUpdate();
      }
      
      toast.success(`Invitations sent to ${selectedGuestsList.length} guests`);
      setSelectedGuests([]);
    } catch (err) {
      console.error('Error sending invitations:', err);
      toast.error('Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  const handlePreviewEmail = () => {
    setEmailPreviewOpen(true);
  };

  const getGuestStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'declined':
        return 'error';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getGuestStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon color="success" />;
      case 'declined':
        return <CancelIcon color="error" />;
      case 'pending':
      default:
        return <PendingIcon color="warning" />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Guest Invitations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<EmailIcon />}
          onClick={handleSendInvitations}
          disabled={sending || selectedGuests.length === 0}
        >
          {sending ? 'Sending...' : 'Send Invitations'}
        </Button>
      </Box>
      
      {/* Invitation Link */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Invitation Link
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            value={invitationLink}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleCopyLink} edge="end">
                    {linkCopied ? <CheckCircleIcon color="success" /> : <ContentCopyIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Share this link with guests to allow them to RSVP directly.
        </Typography>
      </Paper>
      
      {/* Email Template */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Email Template
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email Content"
              multiline
              rows={10}
              value={emailTemplate}
              onChange={(e) => setEmailTemplate(e.target.value)}
              margin="normal"
              helperText="Use [Guest Name] as a placeholder for the guest's name and [Invitation Link] for the RSVP link."
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={handlePreviewEmail}
              sx={{ mt: 1 }}
            >
              Preview Email
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Guest List */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            Select Guests to Invite
          </Typography>
          <Button
            variant="outlined"
            onClick={handleSelectAllGuests}
          >
            {selectedGuests.length === guests.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
        
        {guests.length > 0 ? (
          <Grid container spacing={2}>
            {guests.map((guest) => (
              <Grid item xs={12} sm={6} md={4} key={guest.id}>
                <Card 
                  variant="outlined"
                  sx={{
                    borderColor: selectedGuests.includes(guest.id) ? 'primary.main' : 'divider',
                    bgcolor: selectedGuests.includes(guest.id) ? 'primary.light' : 'background.paper',
                    opacity: guest.invitation_sent ? 0.8 : 1
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" component="div">
                        {guest.name}
                      </Typography>
                      {getGuestStatusIcon(guest.rsvp_status)}
                    </Box>
                    
                    {guest.email && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {guest.email}
                      </Typography>
                    )}
                    
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={guest.rsvp_status} 
                        size="small" 
                        color={getGuestStatusColor(guest.rsvp_status)}
                      />
                      {guest.invitation_sent && (
                        <Chip 
                          label="Invited" 
                          size="small" 
                          color="info"
                        />
                      )}
                      {guest.plus_ones > 0 && (
                        <Chip 
                          label={`+${guest.plus_ones}`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => handleSelectGuest(guest.id)}
                      color={selectedGuests.includes(guest.id) ? 'primary' : 'inherit'}
                    >
                      {selectedGuests.includes(guest.id) ? 'Selected' : 'Select'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No guests have been added to this event yet. Add guests to send invitations.
          </Alert>
        )}
      </Paper>
      
      {/* Email Preview Dialog */}
      <Dialog open={emailPreviewOpen} onClose={() => setEmailPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Email Preview</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Subject: {emailSubject}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {emailTemplate
                .replace('[Guest Name]', 'Sample Guest')
                .replace('[Invitation Link]', invitationLink)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={linkCopied}
        autoHideDuration={2000}
        onClose={() => setLinkCopied(false)}
        message="Link copied to clipboard"
      />
    </Box>
  );
};

export default GuestInvitation;