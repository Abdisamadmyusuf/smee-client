import React, { Component } from 'react'
import ListItem from './ListItem'
import { object } from 'prop-types'
import get from 'get-value'

function compare (a, b) {
  if (a.timestamp < b.timestamp) return 1
  if (a.timestamp > b.timestamp) return -1
  return 0
}
export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = { log: [], filter: '' }
  }

  componentDidMount () {
    window.fetch('/webhooks/logs', { credentials: 'same-origin' }).then(res => res.json()).then(res => {
      this.setState({ log: res.log, loading: false })
    })

    const events = new window.EventSource(window.__WEBHOOK_PROXY_URL)
    events.onmessage = message => {
      const json = JSON.parse(message.data)
      const log = {
        event: json['x-github-event'],
        payload: json.body,
        timestamp: json['x-request-start'],
        id: json['x-request-id']
      }

      this.setState({
        log: [...this.state.log, log]
      })
    }
  }

  render () {
    const { log, filter } = this.state
    let filtered = log
    if (filter) {
      filtered = log.filter(l => {
        if (filter && filter.includes(':')) {
          let [searchString, value] = filter.split(':')
          if (!searchString.startsWith('payload')) searchString = `payload.${searchString}`
          return get(l, searchString) === value
        }
        return true
      })
    }
    const sorted = filtered.sort(compare)

    return (
      <main>
        <div className="py-2 bg-gray-dark">
          <div className="container-md text-white p-responsive d-flex flex-items-center flex-justify-between">
            <h1 className="f4">Recent Deliveries</h1>
          </div>
        </div>
        <div className="container-md py-3 p-responsive">
          <div className="mb-2">
            <div className="d-flex flex-items-center">
              <label htmlFor="search">Filter deliveries</label>
              <a className="ml-2 f6" href="https://github.com/jonschlinkert/get-value" target="_blank" rel="noopener noreferrer">Uses the get-value syntax</a>
            </div>
            <input
              type="text"
              id="search"
              placeholder="repository.name:probot"
              value={filter}
              onChange={e => this.setState({ filter: e.target.value })}
              className="input input-lg width-full Box"
            />
          </div>
          <ul className="Box list-style-none pl-0">
            {sorted.map((l, i, arr) => <ListItem key={l.id} item={l} last={i === arr.length - 1} />)}
          </ul>
        </div>
      </main>
    )
  }
}
