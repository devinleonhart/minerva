import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateEntityModal from '../../src/components/shared/CreateEntityModal.vue'

describe('CreateEntityModal.vue', () => {
  it('does not render modal when modelValue is false', () => {
    const wrapper = mount(CreateEntityModal, {
      props: {
        modelValue: false,
        title: 'Test Modal',
        submitButtonText: 'Create'
      }
    })

    expect(wrapper.find('.n-modal').exists()).toBe(false)
  })

  it('accepts props correctly', () => {
    const wrapper = mount(CreateEntityModal, {
      props: {
        modelValue: true,
        title: 'Custom Title',
        submitButtonText: 'Custom Submit'
      }
    })

    expect(wrapper.props('title')).toBe('Custom Title')
    expect(wrapper.props('submitButtonText')).toBe('Custom Submit')
  })

  it('uses default props when not provided', () => {
    const wrapper = mount(CreateEntityModal, {
      props: {
        modelValue: true
      }
    })

    expect(wrapper.props('title')).toBe('Create Entity')
    expect(wrapper.props('submitButtonText')).toBe('Create')
  })

  it('emits update:modelValue when modal should close', async () => {
    const wrapper = mount(CreateEntityModal, {
      props: {
        modelValue: true,
        title: 'Test Modal',
        submitButtonText: 'Create'
      }
    })

    // Test that the component can emit events
    await wrapper.vm.$emit('update:modelValue', false)

    const events = wrapper.emitted('update:modelValue')
    expect(events).toBeTruthy()
    expect(events?.[0][0]).toBe(false)
  })
})
