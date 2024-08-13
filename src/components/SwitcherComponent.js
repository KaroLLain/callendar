import * as React from 'react'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import { ViewState, EditingState } from '@devexpress/dx-react-scheduler'
import {
  Scheduler,
  Toolbar,
  DayView,
  WeekView,
  MonthView,
  Appointments,
  AppointmentForm,
  AppointmentTooltip,
  DateNavigator,
  DragDropProvider,
  EditRecurrenceMenu,
  AllDayPanel
} from '@devexpress/dx-react-scheduler-material-ui'
import { connectProps } from '@devexpress/dx-react-core'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import TextField from '@mui/material/TextField'
import LocationOn from '@mui/icons-material/LocationOn'
import Notes from '@mui/icons-material/Notes'
import Close from '@mui/icons-material/Close'
import CalendarToday from '@mui/icons-material/CalendarToday'
import Create from '@mui/icons-material/Create'
import { styled } from '@mui/material/styles'
import MenuItem from '@mui/material/MenuItem'

//------------------------ firebase imports ------------------------

import { db } from '../firebase'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { appointments } from '../data/appointments'

//------------------ #FOLD_BLOCK  ---------------------

const PREFIX = 'Schedule'
const classes = {
  content: `${PREFIX}-content`,
  header: `${PREFIX}-header`,
  closeButton: `${PREFIX}-closeButton`,
  buttonGroup: `${PREFIX}-buttonGroup`,
  button: `${PREFIX}-button`,
  picker: `${PREFIX}-picker`,
  wrapper: `${PREFIX}-wrapper`,
  icon: `${PREFIX}-icon`,
  textField: `${PREFIX}-textField`,
  addButton: `${PREFIX}-addButton`,
  container: `${PREFIX}-container`,
  text: `${PREFIX}-text`
}

//------------------ #FOLD_BLOCK  ---------------------

const StyledDiv = styled('div')(({ theme }) => ({
  [`& .${classes.icon}`]: {
    margin: theme.spacing(2, 0),
    marginRight: theme.spacing(2)
  },
  [`& .${classes.header}`]: {
    overflow: 'hidden',
    paddingTop: theme.spacing(0.5)
  },
  [`& .${classes.textField}`]: {
    width: '100%'
  },
  [`& .${classes.content}`]: {
    padding: theme.spacing(2),
    paddingTop: 0
  },
  [`& .${classes.closeButton}`]: {
    float: 'right'
  },
  [`& .${classes.picker}`]: {
    marginRight: theme.spacing(2),
    '&:last-child': {
      marginRight: 0
    },
    width: '50%'
  },
  [`& .${classes.wrapper}`]: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 0)
  },
  [`& .${classes.buttonGroup}`]: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 2)
  },
  [`& .${classes.button}`]: {
    marginLeft: theme.spacing(2)
  },
  [`&.${classes.container}`]: {
    display: 'flex',
    marginBottom: theme.spacing(2),
    justifyContent: 'flex-end'
  },
  [`& .${classes.text}`]: {
    ...theme.typography.h6,
    marginRight: theme.spacing(2)
  }
}))
const StyledFab = styled(Fab)(({ theme }) => ({
  [`&.${classes.addButton}`]: {
    position: 'absolute',
    bottom: theme.spacing(3),
    right: theme.spacing(4)
  }
}))

// --------------------- Locale constants ------------------------

const allDayLocalizationMessages = {
  'pl-PL': {
    allDay: 'Cały dzień'
  },
  'de-GR': {
    allDay: 'Ganztägig'
  },
  'en-US': {
    allDay: 'All Day'
  }
}

const getAllDayMessages = locale => allDayLocalizationMessages[locale]

const LocaleSwitcher = ({ onLocaleChange, currentLocale }) => (
  <StyledDiv className={classes.container}>
    <div className={classes.text}>Locale:</div>
    <TextField
      select
      variant='standard'
      value={currentLocale}
      onChange={onLocaleChange}
    >
      <MenuItem value='pl-PL'>Polski (Polska)</MenuItem>
      <MenuItem value='de-GR'>Deutsch (German)</MenuItem>
      <MenuItem value='en-US'>English (United States)</MenuItem>
    </TextField>
  </StyledDiv>
)

// --------------------- Switcher constants ------------------------

const ExternalViewSwitcher = ({ currentViewName, onChange }) => (
  <RadioGroup
    aria-label='Views'
    style={{ flexDirection: 'row' }}
    name='views'
    value={currentViewName}
    onChange={onChange}
  >
    <FormControlLabel value='Day' control={<Radio />} label='Day' />
    <FormControlLabel value='Week' control={<Radio />} label='Week' />
    <FormControlLabel value='Month' control={<Radio />} label='Month' />
  </RadioGroup>
)


// --------------------- Appointment constants ------------------------
// Saving data
const saveAppointment = async (appointment) => {
  try {
  await addDoc(collection(db, 'appointments'), appointment);
  } catch (e) {
  console.error('Error adding document: ', e);
  }
  };

//fetching data
const fetchAppointments = async () => {
  const querySnapshot = await getDocs(collection(db, 'appointments'));
  const appointments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return appointments;
  };


// --------------------- Appointment form --------------------------

class AppointmentFormContainerBasic extends React.PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      appointmentChanges: {}
    }

    this.getAppointmentData = () => {
      const { appointmentData } = this.props
      return appointmentData
    }
    this.getAppointmentChanges = () => {
      const { appointmentChanges } = this.state
      return appointmentChanges
    }

    this.changeAppointment = this.changeAppointment.bind(this)
    this.commitAppointment = this.commitAppointment.bind(this)
  }

  changeAppointment ({ field, changes }) {
    const nextChanges = {
      ...this.getAppointmentChanges(),
      [field]: changes
    }
    this.setState({
      appointmentChanges: nextChanges
    })
  }

  commitAppointment (type) {
    const { commitChanges } = this.props
    const appointment = {
      ...this.getAppointmentData(),
      ...this.getAppointmentChanges()
    }
    if (type === 'deleted') {
      commitChanges({ [type]: appointment.id })
    } else if (type === 'changed') {
      commitChanges({ [type]: { [appointment.id]: appointment } })
    } else {
      commitChanges({ [type]: appointment })
    }
    this.setState({
      appointmentChanges: {}
    })
  }

  render () {
    const {
      visible,
      visibleChange,
      appointmentData,
      cancelAppointment,
      target,
      onHide
    } = this.props
    const { appointmentChanges } = this.state

    const displayAppointmentData = {
      ...appointmentData,
      ...appointmentChanges
    }

    const isNewAppointment = appointmentData.id === undefined
    const applyChanges = isNewAppointment
      ? () => this.commitAppointment('added')
      : () => this.commitAppointment('changed')

    const textEditorProps = field => ({
      variant: 'outlined',
      onChange: ({ target: change }) =>
        this.changeAppointment({
          field: [field],
          changes: change.value
        }),
      value: displayAppointmentData[field] || '',
      label: field[0].toUpperCase() + field.slice(1),
      className: classes.textField
    })

    const pickerEditorProps = field => ({
      // keyboard: true,
      value: displayAppointmentData[field],
      onChange: date =>
        this.changeAppointment({
          field: [field],
          changes: date
            ? date.toDate()
            : new Date(displayAppointmentData[field])
        }),
      ampm: false,
      inputFormat: 'DD/MM/YYYY HH:mm',
      onError: () => null
    })
    const startDatePickerProps = pickerEditorProps('startDate')
    const endDatePickerProps = pickerEditorProps('endDate')
    const cancelChanges = () => {
      this.setState({
        appointmentChanges: {}
      })
      visibleChange()
      cancelAppointment()
    }

    return (
      <AppointmentForm.Overlay
        visible={visible}
        target={target}
        fullSize
        onHide={onHide}
      >
        <StyledDiv>
          <div className={classes.header}>
            <IconButton
              className={classes.closeButton}
              onClick={cancelChanges}
              size='large'
            >
              <Close color='action' />
            </IconButton>
          </div>
          <div className={classes.content}>
            <div className={classes.wrapper}>
              <Create className={classes.icon} color='action' />
              <TextField {...textEditorProps('title')} />
            </div>
            <div className={classes.wrapper}>
              <CalendarToday className={classes.icon} color='action' />
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DateTimePicker
                  label='Start Date'
                  renderInput={props => (
                    <TextField className={classes.picker} {...props} />
                  )}
                  {...startDatePickerProps}
                />
                <DateTimePicker
                  label='End Date'
                  renderInput={props => (
                    <TextField className={classes.picker} {...props} />
                  )}
                  {...endDatePickerProps}
                />
              </LocalizationProvider>
            </div>
            <div className={classes.wrapper}>
              <LocationOn className={classes.icon} color='action' />
              <TextField {...textEditorProps('location')} />
            </div>
            <div className={classes.wrapper}>
              <Notes className={classes.icon} color='action' />
              <TextField {...textEditorProps('notes')} multiline rows='6' />
            </div>
          </div>
          <div className={classes.buttonGroup}>
            {!isNewAppointment && (
              <Button
                variant='outlined'
                color='secondary'
                className={classes.button}
                onClick={() => {
                  visibleChange()
                  this.commitAppointment('deleted')
                }}
              >
                Delete
              </Button>
            )}
            <Button
              variant='outlined'
              color='primary'
              className={classes.button}
              onClick={() => {
                visibleChange()
                applyChanges()
              }}
            >
              {isNewAppointment ? 'Create' : 'Save'}
            </Button>
          </div>
        </StyledDiv>
      </AppointmentForm.Overlay>
    )
  }
}

export default class ScheduleApp extends React.PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      // data: [],
      data: appointments,
      // currentDate: '2018-06-27',
      currentViewName: 'Month',
      locale: 'pl-PL',
      confirmationVisible: false,
      editingFormVisible: false,
      deletedAppointmentId: undefined,
      editingAppointment: undefined,
      previousAppointment: undefined,
      addedAppointment: {},
      startDayHour: 7,
      endDayHour: 17,
      isNewAppointment: false
    }

    //LOCALE STATE
    this.changeLocale = event => this.setState({ locale: event.target.value })

    //VIEW STATE
    this.currentViewNameChange = e => {
      this.setState({ currentViewName: e.target.value })
    }

    this.toggleConfirmationVisible = this.toggleConfirmationVisible.bind(this)
    this.commitDeletedAppointment = this.commitDeletedAppointment.bind(this)
    this.toggleEditingFormVisibility =
      this.toggleEditingFormVisibility.bind(this)

    this.commitChanges = this.commitChanges.bind(this)
    this.onEditingAppointmentChange = this.onEditingAppointmentChange.bind(this)
    this.onAddedAppointmentChange = this.onAddedAppointmentChange.bind(this)
    this.appointmentForm = connectProps(AppointmentFormContainerBasic, () => {
      const {
        editingFormVisible,
        editingAppointment,
        data,
        addedAppointment,
        isNewAppointment,
        previousAppointment
      } = this.state

      const currentAppointment =
        data.filter(
          appointment =>
            editingAppointment && appointment.id === editingAppointment.id
        )[0] || addedAppointment
      const cancelAppointment = () => {
        if (isNewAppointment) {
          this.setState({
            editingAppointment: previousAppointment,
            isNewAppointment: false
          })
        }
      }

      return {
        visible: editingFormVisible,
        appointmentData: currentAppointment,
        commitChanges: this.commitChanges,
        visibleChange: this.toggleEditingFormVisibility,
        onEditingAppointmentChange: this.onEditingAppointmentChange,
        cancelAppointment
      }
    })
  }

  componentDidMount () {
    this.loadAppointments()
  }

  componentDidUpdate () {
    this.appointmentForm.update()
  }

  loadAppointments = async () => {
    const appointments = await fetchAppointments();
    this.setState({ data: appointments });
    };

  onEditingAppointmentChange (editingAppointment) {
    this.setState({ editingAppointment })
  }

  onAddedAppointmentChange (addedAppointment) {
    this.setState({ addedAppointment })
    const { editingAppointment } = this.state
    if (editingAppointment !== undefined) {
      this.setState({
        previousAppointment: editingAppointment
      })
    }
    this.setState({ editingAppointment: undefined, isNewAppointment: true })
  }

  setDeletedAppointmentId (id) {
    this.setState({ deletedAppointmentId: id })
  }

  toggleEditingFormVisibility () {
    const { editingFormVisible } = this.state
    this.setState({
      editingFormVisible: !editingFormVisible
    })
  }

  toggleConfirmationVisible () {
    const { confirmationVisible } = this.state
    this.setState({ confirmationVisible: !confirmationVisible })
  }

  commitDeletedAppointment () {
    this.setState(state => {
      const { data, deletedAppointmentId } = state
      const nextData = data.filter(
        appointment => appointment.id !== deletedAppointmentId
      )

      return { data: nextData, deletedAppointmentId: null }
    })
    this.toggleConfirmationVisible()
  }

  commitChanges = ({ added, changed, deleted }) => {
    this.setState(state => {
      let { data } = state
      if (added) {
        const startingAddedId =
          data.length > 0 ? data[data.length - 1].id + 1 : 0
        const newAppointment = { id: startingAddedId, ...added }
        data = [...data, newAppointment]
        saveAppointment(newAppointment) // Saving data to firestore
      }
      if (changed) {
        data = data.map(appointment =>
          changed[appointment.id]
            ? { ...appointment, ...changed[appointment.id] }
            : appointment
        )
      }
      if (deleted !== undefined) {
        this.setDeletedAppointmentId(deleted)
        this.toggleConfirmationVisible()
      }
      return { data, addedAppointment: {} }
    })
  }

  render() {
    const {
    data,
    currentDate,
    locale,
    currentViewName,
    confirmationVisible,
    editingFormVisible,
    startDayHour,
    endDayHour
    } = this.state;
    
    console.log(data); // Sprawdź, czy dane są tutaj poprawnie
    
    return (
    <React.Fragment>
    <LocaleSwitcher
    currentLocale={locale}
    onLocaleChange={this.changeLocale}
    />
    <ExternalViewSwitcher
    currentViewName={currentViewName}
    onChange={this.currentViewNameChange}
    />
    <Paper>
    <Scheduler data={data} locale={locale} height={695}>
    <ViewState currentViewName={currentViewName} />
    <Toolbar />
    <DateNavigator />
    <EditingState
    onCommitChanges={this.commitChanges}
    onEditingAppointmentChange={this.onEditingAppointmentChange}
    onAddedAppointmentChange={this.onAddedAppointmentChange}
    />
    <DayView startDayHour={startDayHour} endDayHour={endDayHour} />
    <WeekView startDayHour={startDayHour} endDayHour={endDayHour} />
    <MonthView />
    <AllDayPanel messages={getAllDayMessages(locale)} />
    <EditRecurrenceMenu />
    <Appointments />
    <AppointmentTooltip
    showOpenButton
    showCloseButton
    showDeleteButton
    />
    <AppointmentForm
    overlayComponent={this.appointmentForm}
    visible={editingFormVisible}
    onVisibilityChange={this.toggleEditingFormVisibility}
    />
    <DragDropProvider />
    </Scheduler>
    
    <Dialog open={confirmationVisible} onClose={this.cancelDelete}>
    <DialogTitle>Delete Appointment</DialogTitle>
    <DialogContent>
    <DialogContentText>
    Are you sure you want to delete this appointment?
    </DialogContentText>
    </DialogContent>
    <DialogActions>
    <Button
    onClick={this.toggleConfirmationVisible}
    color='primary'
    variant='outlined'
    >
    Cancel
    </Button>
    <Button
    onClick={this.commitDeletedAppointment}
    color='secondary'
    variant='outlined'
    >
    Delete
    </Button>
    </DialogActions>
    </Dialog>
    
    <StyledFab
    color='secondary'
    className={classes.addButton}
    onClick={() => {
    this.setState({ editingFormVisible: true });
    this.onEditingAppointmentChange(undefined);
    this.onAddedAppointmentChange({
    startDate: new Date(currentDate).setHours(startDayHour),
    endDate: new Date(currentDate).setHours(startDayHour + 1)
    });
    }}
    >
    <AddIcon />
    </StyledFab>
    </Paper>
    </React.Fragment>
    );
    }
    }
