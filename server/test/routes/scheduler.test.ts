import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma, createTestWeekSchedule, createTestDaySchedule, createTestScheduledTask, createTestTaskDefinition } from '../setup.js'

const app = createTestApp()

describe('Scheduler Routes', () => {
  describe('GET /api/scheduler', () => {
    it('should return empty schedule when no weeks exist', async () => {
      const response = await request(app)
        .get('/api/scheduler')
        .expect(200)

      expect(response.body).toMatchObject({
        currentWeek: null,
        taskDefinitions: []
      })
    })

    it('should return current week schedule when it exists', async () => {
      // Create a week schedule for the current week
      const now = new Date()
      const currentWeekStart = new Date(now)
      const dayOfWeek = now.getDay()
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      currentWeekStart.setDate(now.getDate() - daysToSubtract)
      currentWeekStart.setHours(0, 0, 0, 0)

      const weekSchedule = await createTestWeekSchedule({
        weekStartDate: currentWeekStart,
        totalScheduledUnits: 10,
        freeTimeUsed: false
      })

      const daySchedule = await createTestDaySchedule({
        weekScheduleId: weekSchedule.id,
        day: 0,
        dayName: 'Monday',
        totalUnits: 5
      })

      await createTestScheduledTask({
        dayScheduleId: daySchedule.id,
        type: 'BREWING',
        timeSlot: 'MORNING',
        timeUnits: 2,
        day: 0,
        notes: 'Test task'
      })

      const response = await request(app)
        .get('/api/scheduler')
        .expect(200)

      expect(response.body).toHaveProperty('currentWeek')
      expect(response.body.currentWeek).toBeTruthy()
      expect(response.body.currentWeek.weekStartDate).toBe(currentWeekStart.toISOString())
      expect(response.body.currentWeek.totalScheduledUnits).toBe(10)
      expect(response.body.currentWeek.days).toHaveLength(1)
      expect(response.body.currentWeek.days[0].morning).toBeTruthy()
      expect(response.body.currentWeek.days[0].morning.type).toBe('BREWING')
    })

    it('should return task definitions when they exist with a week schedule', async () => {
      // Create a week schedule first (task definitions are only returned when week exists)
      const now = new Date()
      const currentWeekStart = new Date(now)
      const dayOfWeek = now.getDay()
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      currentWeekStart.setDate(now.getDate() - daysToSubtract)
      currentWeekStart.setHours(0, 0, 0, 0)

      await createTestWeekSchedule({
        weekStartDate: currentWeekStart,
        totalScheduledUnits: 0
      })

      await createTestTaskDefinition({
        type: 'BREWING',
        name: 'Brewing Task',
        timeUnits: 2,
        color: '#FF0000',
        description: 'Brew potions'
      })

      const response = await request(app)
        .get('/api/scheduler')
        .expect(200)

      expect(response.body).toHaveProperty('taskDefinitions')
      expect(response.body.taskDefinitions).toHaveLength(1)
      expect(response.body.taskDefinitions[0].type).toBe('BREWING')
      expect(response.body.taskDefinitions[0].name).toBe('Brewing Task')
    })
  })

  describe('POST /api/scheduler/save', () => {
    it('should create new week schedule with days and tasks', async () => {
      const weekStartDate = new Date('2024-01-01')
      weekStartDate.setHours(0, 0, 0, 0)

      const response = await request(app)
        .post('/api/scheduler/save')
        .send({
          currentWeek: {
            weekStartDate: weekStartDate.toISOString(),
            totalScheduledUnits: 20,
            freeTimeUsed: false,
            days: [
              {
                day: 0,
                dayName: 'Monday',
                totalUnits: 5,
                morning: {
                  type: 'BREWING',
                  timeUnits: 2,
                  notes: 'Morning task',
                  details: null
                },
                afternoon: null,
                evening: null
              }
            ]
          },
          taskDefinitions: [
            {
              type: 'BREWING',
              name: 'Brewing',
              timeUnits: 2,
              color: '#FF0000',
              description: 'Brew potions',
              restrictions: null
            }
          ]
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Scheduler state saved successfully'
      })
      expect(response.body).toHaveProperty('weekScheduleId')
      expect(response.body).toHaveProperty('savedAt')

      // Verify it was created
      const weekSchedule = await testPrisma.weekSchedule.findUnique({
        where: { id: response.body.weekScheduleId },
        include: {
          days: {
            include: {
              tasks: true
            }
          }
        }
      })
      expect(weekSchedule).toBeTruthy()
      expect(weekSchedule?.days).toHaveLength(1)
      expect(weekSchedule?.days[0].tasks).toHaveLength(1)
    })

    it('should update existing week schedule', async () => {
      const weekStartDate = new Date('2024-01-01')
      weekStartDate.setHours(0, 0, 0, 0)

      const existingWeek = await createTestWeekSchedule({
        weekStartDate,
        totalScheduledUnits: 10,
        freeTimeUsed: false
      })

      const response = await request(app)
        .post('/api/scheduler/save')
        .send({
          currentWeek: {
            weekStartDate: weekStartDate.toISOString(),
            totalScheduledUnits: 30,
            freeTimeUsed: true,
            days: []
          },
          taskDefinitions: []
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.weekScheduleId).toBe(existingWeek.id)

      // Verify it was updated
      const updated = await testPrisma.weekSchedule.findUnique({
        where: { id: existingWeek.id }
      })
      expect(updated?.totalScheduledUnits).toBe(30)
      expect(updated?.freeTimeUsed).toBe(true)
    })

    it('should return 400 for missing currentWeek', async () => {
      const response = await request(app)
        .post('/api/scheduler/save')
        .send({
          taskDefinitions: []
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Missing required fields: currentWeek and taskDefinitions'
      })
    })

    it('should return 400 for missing taskDefinitions', async () => {
      const weekStartDate = new Date('2024-01-01')
      weekStartDate.setHours(0, 0, 0, 0)

      const response = await request(app)
        .post('/api/scheduler/save')
        .send({
          currentWeek: {
            weekStartDate: weekStartDate.toISOString(),
            totalScheduledUnits: 0,
            freeTimeUsed: false,
            days: []
          }
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Missing required fields: currentWeek and taskDefinitions'
      })
    })

    it('should return 400 when trying to create second week', async () => {
      const weekStartDate1 = new Date('2024-01-01')
      weekStartDate1.setHours(0, 0, 0, 0)

      await createTestWeekSchedule({
        weekStartDate: weekStartDate1,
        totalScheduledUnits: 10
      })

      const weekStartDate2 = new Date('2024-01-08')
      weekStartDate2.setHours(0, 0, 0, 0)

      const response = await request(app)
        .post('/api/scheduler/save')
        .send({
          currentWeek: {
            weekStartDate: weekStartDate2.toISOString(),
            totalScheduledUnits: 0,
            freeTimeUsed: false,
            days: []
          },
          taskDefinitions: []
        })
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'A week already exists. Please delete the current week first'
      })
      expect(response.body).toHaveProperty('existingWeekId')
      expect(response.body).toHaveProperty('existingWeekCount')
    })
  })

  describe('GET /api/scheduler/load/:weekStartDate', () => {
    it('should load week schedule by date', async () => {
      const weekStartDate = new Date('2024-01-01')
      weekStartDate.setHours(0, 0, 0, 0)

      const weekSchedule = await createTestWeekSchedule({
        weekStartDate,
        totalScheduledUnits: 15,
        freeTimeUsed: true
      })

      const daySchedule = await createTestDaySchedule({
        weekScheduleId: weekSchedule.id,
        day: 0,
        dayName: 'Monday',
        totalUnits: 5
      })

      await createTestScheduledTask({
        dayScheduleId: daySchedule.id,
        type: 'GATHER_INGREDIENT',
        timeSlot: 'AFTERNOON',
        timeUnits: 3,
        day: 0
      })

      const response = await request(app)
        .get(`/api/scheduler/load/${weekStartDate.toISOString()}`)
        .expect(200)

      expect(response.body).toHaveProperty('currentWeek')
      expect(response.body.currentWeek).toBeTruthy()
      expect(response.body.currentWeek.totalScheduledUnits).toBe(15)
      expect(response.body.currentWeek.freeTimeUsed).toBe(true)
      expect(response.body.currentWeek.days).toHaveLength(1)
      expect(response.body.currentWeek.days[0].afternoon).toBeTruthy()
      expect(response.body.currentWeek.days[0].afternoon.type).toBe('GATHER_INGREDIENT')
    })

    it('should return null when week does not exist', async () => {
      const weekStartDate = new Date('2024-12-31')
      weekStartDate.setHours(0, 0, 0, 0)

      const response = await request(app)
        .get(`/api/scheduler/load/${weekStartDate.toISOString()}`)
        .expect(200)

      expect(response.body).toMatchObject({
        currentWeek: null,
        taskDefinitions: []
      })
    })

    it('should return 400 for invalid date', async () => {
      const response = await request(app)
        .get('/api/scheduler/load/invalid-date')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid week start date'
      })
    })

    it('should return task definitions with loaded week', async () => {
      const weekStartDate = new Date('2024-01-01')
      weekStartDate.setHours(0, 0, 0, 0)

      await createTestWeekSchedule({
        weekStartDate,
        totalScheduledUnits: 0
      })

      await createTestTaskDefinition({
        type: 'RESEARCH_RECIPES',
        name: 'Research Recipes',
        timeUnits: 4,
        color: '#00FF00',
        description: 'Research new recipes'
      })

      const response = await request(app)
        .get(`/api/scheduler/load/${weekStartDate.toISOString()}`)
        .expect(200)

      expect(response.body.taskDefinitions).toHaveLength(1)
      expect(response.body.taskDefinitions[0].type).toBe('RESEARCH_RECIPES')
    })
  })

  describe('DELETE /api/scheduler/:id', () => {
    it('should delete week schedule by ID', async () => {
      const weekStartDate = new Date('2024-01-01')
      weekStartDate.setHours(0, 0, 0, 0)

      const weekSchedule = await createTestWeekSchedule({
        weekStartDate,
        totalScheduledUnits: 10
      })

      const response = await request(app)
        .delete(`/api/scheduler/${weekSchedule.id}`)
        .expect(200)

      expect(response.body).toMatchObject({
        deletedWeeks: 1,
        message: 'Week deleted successfully'
      })

      // Verify it was deleted
      const deleted = await testPrisma.weekSchedule.findUnique({
        where: { id: weekSchedule.id }
      })
      expect(deleted).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/scheduler/abc')
        .expect(400)

      expect(response.body).toMatchObject({
        error: 'Invalid scheduler ID'
      })
    })

    it('should return 404 for non-existent week schedule', async () => {
      const response = await request(app)
        .delete('/api/scheduler/99999')
        .expect(404)

      expect(response.body).toMatchObject({
        error: 'Scheduler not found'
      })
    })
  })

  describe('DELETE /api/scheduler', () => {
    it('should delete all week schedules', async () => {
      const weekStartDate1 = new Date('2024-01-01')
      weekStartDate1.setHours(0, 0, 0, 0)
      const weekStartDate2 = new Date('2024-01-08')
      weekStartDate2.setHours(0, 0, 0, 0)

      await createTestWeekSchedule({
        weekStartDate: weekStartDate1,
        totalScheduledUnits: 10
      })
      await createTestWeekSchedule({
        weekStartDate: weekStartDate2,
        totalScheduledUnits: 15
      })

      const response = await request(app)
        .delete('/api/scheduler')
        .expect(200)

      expect(response.body).toMatchObject({
        deletedWeeks: 2,
        message: 'All weeks deleted successfully'
      })

      // Verify all were deleted
      const remaining = await testPrisma.weekSchedule.findMany()
      expect(remaining).toHaveLength(0)
    })

    it('should return success message when no weeks exist', async () => {
      const response = await request(app)
        .delete('/api/scheduler')
        .expect(200)

      expect(response.body).toMatchObject({
        deletedWeeks: 0,
        message: 'No weeks found to delete'
      })
    })
  })

  describe('POST /api/scheduler/cleanup', () => {
    it('should delete all scheduler data', async () => {
      const weekStartDate = new Date('2024-01-01')
      weekStartDate.setHours(0, 0, 0, 0)

      const weekSchedule = await createTestWeekSchedule({
        weekStartDate,
        totalScheduledUnits: 10
      })

      const daySchedule = await createTestDaySchedule({
        weekScheduleId: weekSchedule.id,
        day: 0,
        dayName: 'Monday',
        totalUnits: 5
      })

      await createTestScheduledTask({
        dayScheduleId: daySchedule.id,
        type: 'BREWING',
        timeSlot: 'MORNING',
        timeUnits: 2,
        day: 0
      })

      const response = await request(app)
        .post('/api/scheduler/cleanup')
        .expect(200)

      expect(response.body).toMatchObject({
        message: 'Scheduler cleaned up successfully'
      })
      expect(response.body.deletedWeeks).toBeGreaterThan(0)
      expect(response.body.deletedDays).toBeGreaterThan(0)
      expect(response.body.deletedTasks).toBeGreaterThan(0)

      // Verify all were deleted
      const remainingWeeks = await testPrisma.weekSchedule.findMany()
      const remainingDays = await testPrisma.daySchedule.findMany()
      const remainingTasks = await testPrisma.scheduledTask.findMany()
      expect(remainingWeeks).toHaveLength(0)
      expect(remainingDays).toHaveLength(0)
      expect(remainingTasks).toHaveLength(0)
    })

    it('should return zero counts when no data exists', async () => {
      const response = await request(app)
        .post('/api/scheduler/cleanup')
        .expect(200)

      expect(response.body).toMatchObject({
        deletedTasks: 0,
        deletedDays: 0,
        deletedWeeks: 0,
        message: 'Scheduler cleaned up successfully'
      })
    })
  })
})
