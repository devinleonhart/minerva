import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testPrisma } from '../setup.js'

const app = createTestApp()

describe('Scheduler Routes', () => {
  describe('GET /api/scheduler', () => {
    it('should return null when no week schedule exists', async () => {
      const response = await request(app)
        .get('/api/scheduler')
        .expect(200)

      expect(response.body).toEqual({
        currentWeek: null,
        taskDefinitions: []
      })
    })

    it('should return current week schedule when it exists', async () => {
      // Create a week schedule
      const weekStart = new Date()
      weekStart.setHours(0, 0, 0, 0)

      const weekSchedule = await testPrisma.weekSchedule.create({
        data: {
          weekStartDate: weekStart,
          totalScheduledUnits: 5,
          freeTimeUsed: false
        }
      })

      // Create day schedule
      const daySchedule = await testPrisma.daySchedule.create({
        data: {
          weekScheduleId: weekSchedule.id,
          day: 0,
          dayName: 'Monday',
          totalUnits: 2
        }
      })

      // Create scheduled task
      await testPrisma.scheduledTask.create({
        data: {
          type: 'GATHER_INGREDIENT',
          timeUnits: 2,
          day: 0,
          timeSlot: 'MORNING',
          notes: 'Test work task',
          dayScheduleId: daySchedule.id
        }
      })

      // Create task definition
      await testPrisma.taskDefinition.create({
        data: {
          type: 'GATHER_INGREDIENT',
          name: 'Work',
          timeUnits: 2,
          color: '#3B82F6',
          description: 'Work tasks'
        }
      })

      const response = await request(app)
        .get('/api/scheduler')
        .expect(200)

      expect(response.body.currentWeek).toBeTruthy()
      expect(response.body.currentWeek.totalScheduledUnits).toBe(5)
      expect(response.body.currentWeek.freeTimeUsed).toBe(false)
      expect(response.body.currentWeek.days).toHaveLength(1)
      expect(response.body.currentWeek.days[0]).toMatchObject({
        day: 0,
        dayName: 'Monday',
        totalUnits: 2
      })

      expect(response.body.taskDefinitions).toHaveLength(1)
      expect(response.body.taskDefinitions[0]).toMatchObject({
        type: 'GATHER_INGREDIENT',
        name: 'Work',
        timeUnits: 2,
        color: '#3B82F6'
      })
    })
  })

  describe('POST /api/scheduler/save', () => {
    it('should create new week schedule', async () => {
      const weekData = {
        currentWeek: {
          weekStartDate: '2025-08-18T00:00:00.000Z',
          totalScheduledUnits: 3,
          freeTimeUsed: false,
          days: [
            {
              day: 0,
              dayName: 'Monday',
              totalUnits: 3,
              morning: {
                type: 'GATHER_INGREDIENT',
                timeUnits: 1,
                day: 0,
                notes: 'Morning work'
              },
              afternoon: {
                type: 'RESEARCH_RECIPES',
                timeUnits: 2,
                day: 0,
                notes: 'Afternoon study'
              },
              evening: null
            }
          ]
        },
        taskDefinitions: [
          {
            type: 'GATHER_INGREDIENT',
            name: 'Work',
            timeUnits: 1,
            color: '#3B82F6',
            description: 'Work tasks'
          },
          {
            type: 'RESEARCH_RECIPES',
            name: 'Study',
            timeUnits: 2,
            color: '#10B981',
            description: 'Study tasks'
          }
        ]
      }

      const response = await request(app)
        .post('/api/scheduler/save')
        .send(weekData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Scheduler state saved successfully')
      expect(response.body.weekScheduleId).toBeTruthy()

      // Verify in database
      const dbWeek = await testPrisma.weekSchedule.findFirst({
        include: {
          days: {
            include: { tasks: true }
          }
        }
      })

      expect(dbWeek).toBeTruthy()
      expect(dbWeek?.totalScheduledUnits).toBe(3)
      expect(dbWeek?.days).toHaveLength(1)
      expect(dbWeek?.days[0].tasks).toHaveLength(2)

      const dbTaskDefs = await testPrisma.taskDefinition.findMany()
      expect(dbTaskDefs).toHaveLength(2)
    })

    it('should update existing week schedule', async () => {
      const weekStart = new Date('2025-08-18T00:00:00.000Z')

      // Create initial week schedule
      const existingWeek = await testPrisma.weekSchedule.create({
        data: {
          weekStartDate: weekStart,
          totalScheduledUnits: 1,
          freeTimeUsed: false
        }
      })

      const weekData = {
        currentWeek: {
          weekStartDate: '2025-08-18T00:00:00.000Z',
          totalScheduledUnits: 5,
          freeTimeUsed: true,
          days: [
            {
              day: 0,
              dayName: 'Monday',
              totalUnits: 2,
              morning: {
                type: 'GATHER_INGREDIENT',
                timeUnits: 2,
                day: 0,
                notes: 'Updated work'
              },
              afternoon: null,
              evening: null
            }
          ]
        },
        taskDefinitions: [
          {
            type: 'GATHER_INGREDIENT',
            name: 'Updated Work',
            timeUnits: 2,
            color: '#EF4444',
            description: 'Updated work tasks'
          }
        ]
      }

      const response = await request(app)
        .post('/api/scheduler/save')
        .send(weekData)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify update in database
      const dbWeek = await testPrisma.weekSchedule.findUnique({
        where: { id: existingWeek.id },
        include: {
          days: {
            include: { tasks: true }
          }
        }
      })

      expect(dbWeek?.totalScheduledUnits).toBe(5)
      expect(dbWeek?.freeTimeUsed).toBe(true)
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/scheduler/save')
        .send({})
        .expect(400)

      expect(response.body.error).toBe('Missing required fields: currentWeek and taskDefinitions')
    })

    it('should return 400 when multiple weeks exist with different start dates', async () => {
      // Create existing week with different date
      await testPrisma.weekSchedule.create({
        data: {
          weekStartDate: new Date('2025-08-10T00:00:00.000Z'),
          totalScheduledUnits: 1,
          freeTimeUsed: false
        }
      })

      const weekData = {
        currentWeek: {
          weekStartDate: '2025-08-18T00:00:00.000Z',
          totalScheduledUnits: 3,
          freeTimeUsed: false,
          days: []
        },
        taskDefinitions: []
      }

      const response = await request(app)
        .post('/api/scheduler/save')
        .send(weekData)
        .expect(400)

      expect(response.body.error).toBe('A week already exists. Please delete the current week first')
    })
  })

  describe('GET /api/scheduler/load/:weekStartDate', () => {
    it('should load specific week schedule', async () => {
      const weekStart = new Date('2025-08-18T00:00:00.000Z')

      const weekSchedule = await testPrisma.weekSchedule.create({
        data: {
          weekStartDate: weekStart,
          totalScheduledUnits: 2,
          freeTimeUsed: true
        }
      })

      const daySchedule = await testPrisma.daySchedule.create({
        data: {
          weekScheduleId: weekSchedule.id,
          day: 1,
          dayName: 'Tuesday',
          totalUnits: 2
        }
      })

      await testPrisma.scheduledTask.create({
        data: {
          type: 'FREE_TIME',
          timeUnits: 2,
          day: 1,
          timeSlot: 'EVENING',
          notes: 'Evening workout',
          dayScheduleId: daySchedule.id
        }
      })

      const response = await request(app)
        .get('/api/scheduler/load/2025-08-18T00:00:00.000Z')
        .expect(200)

      expect(response.body.currentWeek).toBeTruthy()
      expect(response.body.currentWeek.totalScheduledUnits).toBe(2)
      expect(response.body.currentWeek.freeTimeUsed).toBe(true)
      expect(response.body.currentWeek.days).toHaveLength(1)
      expect(response.body.currentWeek.days[0].dayName).toBe('Tuesday')
    })

    it('should return null for non-existent week', async () => {
      const response = await request(app)
        .get('/api/scheduler/load/2025-12-25T00:00:00.000Z')
        .expect(200)

      expect(response.body).toEqual({
        currentWeek: null,
        taskDefinitions: []
      })
    })

    it('should return 400 for invalid date', async () => {
      const response = await request(app)
        .get('/api/scheduler/load/invalid-date')
        .expect(400)

      expect(response.body.error).toBe('Invalid week start date')
    })
  })

  describe('DELETE /api/scheduler/:id', () => {
    it('should delete week schedule', async () => {
      const weekSchedule = await testPrisma.weekSchedule.create({
        data: {
          weekStartDate: new Date(),
          totalScheduledUnits: 1,
          freeTimeUsed: false
        }
      })

      const response = await request(app)
        .delete(`/api/scheduler/${weekSchedule.id}`)
        .expect(200)

      expect(response.body.deletedWeeks).toBe(1)

      // Verify deletion in database
      const dbWeek = await testPrisma.weekSchedule.findUnique({
        where: { id: weekSchedule.id }
      })
      expect(dbWeek).toBeNull()
    })

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .delete('/api/scheduler/invalid')
        .expect(400)

      expect(response.body.error).toBe('Invalid scheduler ID')
    })

    it('should return 404 for non-existent schedule', async () => {
      const response = await request(app)
        .delete('/api/scheduler/99999')
        .expect(404)

      expect(response.body.error).toBe('Scheduler not found')
    })
  })

  describe('POST /api/scheduler/cleanup', () => {
    it('should cleanup all scheduler data', async () => {
      // Create test data
      const weekSchedule = await testPrisma.weekSchedule.create({
        data: {
          weekStartDate: new Date(),
          totalScheduledUnits: 1,
          freeTimeUsed: false
        }
      })

      const daySchedule = await testPrisma.daySchedule.create({
        data: {
          weekScheduleId: weekSchedule.id,
          day: 0,
          dayName: 'Monday',
          totalUnits: 1
        }
      })

      await testPrisma.scheduledTask.create({
        data: {
          type: 'GATHER_INGREDIENT',
          timeUnits: 1,
          day: 0,
          timeSlot: 'MORNING',
          dayScheduleId: daySchedule.id
        }
      })

      const response = await request(app)
        .post('/api/scheduler/cleanup')
        .expect(200)

      expect(response.body.deletedTasks).toBeGreaterThanOrEqual(1)
      expect(response.body.deletedDays).toBeGreaterThanOrEqual(1)
      expect(response.body.deletedWeeks).toBeGreaterThanOrEqual(1)
      expect(response.body.message).toBe('Scheduler cleaned up successfully')

      // Verify cleanup in database
      const remainingWeeks = await testPrisma.weekSchedule.count()
      const remainingDays = await testPrisma.daySchedule.count()
      const remainingTasks = await testPrisma.scheduledTask.count()

      expect(remainingWeeks).toBe(0)
      expect(remainingDays).toBe(0)
      expect(remainingTasks).toBe(0)
    })
  })
})
