import axios from 'axios'
import buildQuery from 'odata-query'
import _ from 'lodash'


export default class SimpleOdataClient {

  /**
   * Creates the instance
   * @param 
   * apiRoot = the root path
   * subscriptionKey an object of the form {keyName: name, subscriptionKey: value}
   * apiVersion an object of the form {apiVersionName: name, version: value}
   * replaceParameterWith an object of the form {parameterToReplace: parameter, replacement: value}
   */
  constructor (apiRoot, subscriptionKey = null, apiVersion = null, replaceParameterWith = null) {
    this.apiRoot = apiRoot
    this.subscriptionKey = subscriptionKey
    this.apiVersion = apiVersion
    this.replaceParameterWith = replaceParameterWith
    this.filters = {}
    this.endpoint = ''
  }

  /// //////////////////////////////////////////////////////////////////////////////
  // Actions
  /// /////////////////////////////////////////////////////////////////////////////

  get (responseType = 'json', additionalHeaders = []) {
    this.responseType = responseType
    return this.makeApiCall('get', `${this.endpoint}${this.createQueryParamaters('get')}`)
  }

  /// //////////////////////////////////////////////////////////////////////////////////
  // endpoint setters
  /// /////////////////////////////////////////////////////////////////////////////////

  Endpoint (endpoint) {
    this.endpoint = `/${endpoint}`
    return this
  }

  /// //////////////////////////////////////////////////////////////////////////////////
  // search setters
  /// /////////////////////////////////////////////////////////////////////////////////

  Search (value) {
    this.search = value ?? null
    return this
  }

  /// //////////////////////////////////////////////////////////////////////////////////
  // OrderBy
  /// //////////////////////////////////////////////////////////////////////////////////
  OrderBy (value = []) {
    this.orderBy = value.length ? value : null
    return this
  }

  /// //////////////////////////////////////////////////////////////////////////////////
  // count
  /// //////////////////////////////////////////////////////////////////////////////////
  Count (value = 10) {
    this.count = value
    return this
  }

  /// //////////////////////////////////////////////////////////////////////////////////
  // Select
  /// //////////////////////////////////////////////////////////////////////////////////
  Select (value = []) {
    this.select = value.length ? value : null
    return this
  }

  /// //////////////////////////////////////////////////////////////////////////////////
  // filters
  /// //////////////////////////////////////////////////////////////////////////////////
  /**
   * Creates a filters query string
   * @param Array of Strings Objects with Propertyname to filter, property value and operator defaults to eq
   * {propertyName: 'myProperty', propertyValue: 'myPropertyValue', operator: 'eq'}
   * possible operators eq, ne, gt, ge, lt, le, in
   */

  Filters (filtersArray, logicalOperator = 'and') {    
    var filtersSubSet = []
    filtersArray.forEach(filter => {
      var filterObject = {}
      if (filter.hasOwnProperty('operator')) {
        var filterObjectOperator = {}
        filterObjectOperator[filter.operator] = filter.propertyValue
        filterObject[filter.propertyName] = filterObjectOperator
      } else if (typeof filter === 'string') {
        filtersSubSet.push(filter)
      } else {
        filterObject[filter.propertyName] = { eq: filter.propertyValue }
      }
      filtersSubSet.push(filterObject)
    })
    this.filters[logicalOperator] = filtersSubSet
    return this
  }


  /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  // private methods
  /// ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  makeApiCall (method, endpoint, data = null, additionalHeaders = null) {
    const path = this.createPath(endpoint)
    return new Promise((resolve, reject) => {
      axios({
        method: method,
        url: path,
        data: data,
        headers: this.createHeaders(additionalHeaders),
        responseType: this.responseType
      })
        .then(data => {
          resolve(data)
        })
        .catch(error => {
          reject(error)
        })
    })
  }

  createPath (endpoint) {
    return this.apiRoot + endpoint
  }

  createQueryParamaters (method) {
    var query = {}
    var additionalParameters = ''
    if (this.filters) {
      query['filter'] = this.filters
    }
    if (this.search) {
      query['search'] = this.search
    }
    if (this.select) {
      query['select'] = this.select
    }
    if (this.orderBy) {
      query['orderBy'] = this.orderBy
    }
    if (this.count) {
      query['top'] = this.count
    }
    if (this.subscriptionKey) {
      additionalParameters += `&${this.subscriptionKey.keyName}=${this.subscriptionKey.subscriptionKey}`
    }
    if (this.apiVersion) {
      additionalParameters += `&${this.apiVersion.apiVersionName}=${this.apiVersion.version}`
    }
    var builtQuery = buildQuery(query) + additionalParameters
    if (this.replaceParameterWith) {
      this.replaceParameterWith.forEach(parameter => {
        builtQuery = _.replace(builtQuery, `${parameter.parameterToReplace}`, `${parameter.replacement}`)
      })
    }
    return builtQuery
  }

  createHeaders (additionalHeaders) {
    this.headers = {}
    if (additionalHeaders) {
      Object.entries(additionalHeaders).forEach(([key, value]) => {
        this.headers[key] = value
      })
    }
    return this.headers
  }
}