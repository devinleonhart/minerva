import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../helpers.js'
import { testDb, createTestWeekSchedule, createTestDaySchedule, createTestScheduledTask } from '../setup.js'
import { eq } from 'drizzle-orm'
import * as tables from '../../db/index.js'

const app = createTestApp()

describe('Scheduler Routes', () => {
  describe('GET /api/scheduler/week', () => {
    it('returns null when no week exists', async () => {
      const res = await request(app).get('/api/scheduler/week').expect(200)
      expect(res.body.week).toBeNull()
    })

    it('returns the current week with days and tasks', async () => {
      const week = await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02'), totalScheduledUnits: 0 })
      const day = await createTestDaySchedule({ weekScheduleId: week.id, day: 0, dayName: 'Monday' })
      await createTestScheduledTask({
        dayScheduleId: day.id,
        type: 'GATHER_INGREDIENT',
        timeSlot: 'MORNING',
        timeUnits: 1,
        day: 0,
        notes: 'Pick mushrooms'
      })

      const res = await request(app).get('/api/scheduler/week').expect(200)
      expect(res.body.week).toBeTruthy()
      expect(res.body.week.id).toBe(week.id)
      expect(res.body.week.days).toHaveLength(1)
      expect(res.body.week.days[0].tasks.MORNING).toMatchObject({
        type: 'GATHER_INGREDIENT',
        timeUnits: 1,
        notes: 'Pick mushrooms'
      })
      expect(res.body.week.days[0].tasks.AFTERNOON).toBeNull()
      expect(res.body.week.days[0].tasks.EVENING).toBeNull()
    })
  })

  describe('POST /api/scheduler/week', () => {
    it('creates a new week with 7 days', async () => {
      const res = await request(app).post('/api/scheduler/week').expect(200)
      expect(res.body.week).toBeTruthy()
      expect(res.body.week.days).toHaveLength(7)
      expect(res.body.week.days[0].dayName).toBe('Monday')
      expect(res.body.week.days[6].dayName).toBe('Sunday')

      const weeks = await testDb.select().from(tables.weekSchedule)
      expect(weeks).toHaveLength(1)
      const days = await testDb.select().from(tables.daySchedule)
      expect(days).toHaveLength(7)
    })

    it('returns 409 if a week already exists', async () => {
      await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      const res = await request(app).post('/api/scheduler/week').expect(409)
      expect(res.body.error).toMatch(/already exists/)
    })
  })

  describe('DELETE /api/scheduler/week', () => {
    it('deletes the current week', async () => {
      await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      const res = await request(app).delete('/api/scheduler/week').expect(200)
      expect(res.body.success).toBe(true)

      const weeks = await testDb.select().from(tables.weekSchedule)
      expect(weeks).toHaveLength(0)
    })

    it('returns 404 when no week exists', async () => {
      const res = await request(app).delete('/api/scheduler/week').expect(404)
      expect(res.body.error).toMatch(/No week/)
    })
  })

  describe('POST /api/scheduler/tasks', () => {
    it('adds a 1-unit task to a slot', async () => {
      const week = await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      const day = await createTestDaySchedule({ weekScheduleId: week.id, day: 0, dayName: 'Monday' })

      const res = await request(app)
        .post('/api/scheduler/tasks')
        .send({ weekId: week.id, day: 0, timeSlot: 'MORNING', taskType: 'GATHER_INGREDIENT', notes: 'Herbs' })
        .expect(200)

      expect(res.body.week.days[0].tasks.MORNING).toMatchObject({
        type: 'GATHER_INGREDIENT',
        timeUnits: 1,
        notes: 'Herbs'
      })

      const tasks = await testDb.select().from(tables.scheduledTask).where(eq(tables.scheduledTask.dayScheduleId, day.id))
      expect(tasks).toHaveLength(1)
    })

    it('adds a 2-unit task starting at MORNING', async () => {
      const week = await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      await createTestDaySchedule({ weekScheduleId: week.id, day: 0, dayName: 'Monday' })

      const res = await request(app)
        .post('/api/scheduler/tasks')
        .send({ weekId: week.id, day: 0, timeSlot: 'MORNING', taskType: 'SECURE_INGREDIENTS' })
        .expect(200)

      expect(res.body.week.days[0].tasks.MORNING).toMatchObject({ type: 'SECURE_INGREDIENTS', timeUnits: 2 })
      expect(res.body.week.days[0].tasks.AFTERNOON).toBeNull()
      expect(res.body.week.days[0].tasks.EVENING).toBeNull()
    })

    it('rejects BREWING at MORNING', async () => {
      const week = await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      await createTestDaySchedule({ weekScheduleId: week.id, day: 0, dayName: 'Monday' })

      const res = await request(app)
        .post('/api/scheduler/tasks')
        .send({ weekId: week.id, day: 0, timeSlot: 'MORNING', taskType: 'BREWING' })
        .expect(400)

      expect(res.body.error).toMatch(/cannot start/)
    })

    it('rejects task when slot is already occupied', async () => {
      const week = await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      const day = await createTestDaySchedule({ weekScheduleId: week.id, day: 0, dayName: 'Monday' })
      await createTestScheduledTask({ dayScheduleId: day.id, type: 'GATHER_INGREDIENT', timeSlot: 'MORNING', timeUnits: 1, day: 0 })

      const res = await request(app)
        .post('/api/scheduler/tasks')
        .send({ weekId: week.id, day: 0, timeSlot: 'MORNING', taskType: 'GATHER_INGREDIENT' })
        .expect(409)

      expect(res.body.error).toMatch(/occupied/)
    })

    it('rejects 3-unit task starting at AFTERNOON', async () => {
      const week = await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      await createTestDaySchedule({ weekScheduleId: week.id, day: 0, dayName: 'Monday' })

      const res = await request(app)
        .post('/api/scheduler/tasks')
        .send({ weekId: week.id, day: 0, timeSlot: 'AFTERNOON', taskType: 'RESEARCH_RECIPES' })
        .expect(400)

      expect(res.body.error).toMatch(/cannot start/)
    })

    it('rejects 2-unit task starting at EVENING', async () => {
      const week = await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      await createTestDaySchedule({ weekScheduleId: week.id, day: 0, dayName: 'Monday' })

      const res = await request(app)
        .post('/api/scheduler/tasks')
        .send({ weekId: week.id, day: 0, timeSlot: 'EVENING', taskType: 'SECURE_INGREDIENTS' })
        .expect(400)

      expect(res.body.error).toMatch(/cannot start/)
    })

    it('returns 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/scheduler/tasks')
        .send({ weekId: 1, day: 0 })
        .expect(400)

      expect(res.body.error).toMatch(/Missing/)
    })

    it('returns 400 for invalid task type', async () => {
      const res = await request(app)
        .post('/api/scheduler/tasks')
        .send({ weekId: 1, day: 0, timeSlot: 'MORNING', taskType: 'INVALID' })
        .expect(400)

      expect(res.body.error).toMatch(/Invalid task type/)
    })
  })

  describe('PATCH /api/scheduler/tasks/:id', () => {
    it('updates task notes', async () => {
      const week = await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      const day = await createTestDaySchedule({ weekScheduleId: week.id, day: 0, dayName: 'Monday' })
      const task = await createTestScheduledTask({
        dayScheduleId: day.id,
        type: 'GATHER_INGREDIENT',
        timeSlot: 'MORNING',
        timeUnits: 1,
        day: 0,
        notes: 'Old notes'
      })

      const res = await request(app)
        .patch(`/api/scheduler/tasks/${task.id}`)
        .send({ notes: 'New notes' })
        .expect(200)

      expect(res.body.task.notes).toBe('New notes')

      const [updated] = await testDb.select().from(tables.scheduledTask).where(eq(tables.scheduledTask.id, task.id))
      expect(updated?.notes).toBe('New notes')
    })

    it('returns 404 for non-existent task', async () => {
      const res = await request(app)
        .patch('/api/scheduler/tasks/99999')
        .send({ notes: 'x' })
        .expect(404)

      expect(res.body.error).toMatch(/not found/)
    })

    it('returns 400 for invalid ID', async () => {
      const res = await request(app)
        .patch('/api/scheduler/tasks/abc')
        .send({ notes: 'x' })
        .expect(400)

      expect(res.body.error).toMatch(/Invalid/)
    })
  })

  describe('DELETE /api/scheduler/tasks/:id', () => {
    it('removes a task and returns updated week', async () => {
      const week = await createTestWeekSchedule({ weekStartDate: new Date('2026-03-02') })
      const day = await createTestDaySchedule({ weekScheduleId: week.id, day: 0, dayName: 'Monday' })
      const task = await createTestScheduledTask({
        dayScheduleId: day.id,
        type: 'GATHER_INGREDIENT',
        timeSlot: 'MORNING',
        timeUnits: 1,
        day: 0
      })

      const res = await request(app)
        .delete(`/api/scheduler/tasks/${task.id}`)
        .expect(200)

      expect(res.body.week).toBeTruthy()
      expect(res.body.week.days[0].tasks.MORNING).toBeNull()

      const tasks = await testDb.select().from(tables.scheduledTask).where(eq(tables.scheduledTask.id, task.id))
      expect(tasks).toHaveLength(0)
    })

    it('returns 404 for non-existent task', async () => {
      const res = await request(app)
        .delete('/api/scheduler/tasks/99999')
        .expect(404)

      expect(res.body.error).toMatch(/not found/)
    })

    it('returns 400 for invalid ID', async () => {
      const res = await request(app)
        .delete('/api/scheduler/tasks/abc')
        .expect(400)

      expect(res.body.error).toMatch(/Invalid/)
    })
  })
})
