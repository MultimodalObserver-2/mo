import { ActivityCreate } from "../../types/Protocol"

const getFinalActivityName = (
  acts: ActivityCreate[],
  realName: string,
  name = realName,
  num = 1
) => {
  const nameExists = acts.some((activity) => activity.name === name)
  if (nameExists) {
    const newName = `${realName} (${num})`
    return getFinalActivityName(acts, realName, newName, num + 1)
  }

  return name
}

const addActivity = (
  activity: ActivityCreate,
  activities: ActivityCreate[],
  setActivities: React.Dispatch<React.SetStateAction<ActivityCreate[]>>
) => {
  const newName = getFinalActivityName(activities, activity.name)
  activity.name = newName
  setActivities((prevActivities) => [...prevActivities, activity])
}

const changeActivities = (
  prevActivities: ActivityCreate[],
  activity: ActivityCreate,
  originalName: string
) => {
  return prevActivities.map((act) => (act.name === originalName ? { ...act, ...activity } : act))
}

const updateActivity = (
  activities: ActivityCreate[],
  setActivities: React.Dispatch<React.SetStateAction<ActivityCreate[]>>,
  originalName: string,
  activity: ActivityCreate
) => {
  const acts = activities.filter((act) => act.name !== originalName)
  const newName = getFinalActivityName(acts, activity.name)
  activity.name = newName
  setActivities((prevActivities) => changeActivities(prevActivities, activity, originalName))
}

export { addActivity, updateActivity }
