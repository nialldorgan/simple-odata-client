import axios from 'axios'
import buildQuery from 'odata-query'
import _ from 'lodash'


export default class SimpleOdataClient {

  /**
   * Creates the instance
   * @param 
   * apiRoot = the root path
   * customKeyValuePairs (optional) an array of Objects of the form {keyName: name, keyValue: value}
   * replaceParameterKeyWith (optional) an object of the form {parameterToReplace: parameter, replacement: value}
   * token (optional) a string containing a barer token for OAuth, if present will be added to headers as Authorization: Bearer token
   */
  constructor (apiRoot, customKeyValuePairs = [], replaceParameterKeyWith = null, token = null) {
    this.apiRoot = apiRoot
    this.customKeyValuePairs = customKeyValuePairs
    this.replaceParameterKeyWith = replaceParameterKeyWith
    this.token = token   
    this.filters = {}
    this.endpoint = ''
  }

  /// //////////////////////////////////////////////////////////////////////////////
  // Actions
  /// /////////////////////////////////////////////////////////////////////////////

  /**
   * executes a get request on the url
   * @param
   * responseType (optional) string containing the required response type default json
   * additionalHeaders (optional) an object of key value pairs to add to headers
   * tempKeyValuePairs (optional) and array of Objects of the form {keyName: name, keyValue: value} to add additional paramenters to the request
   * this will only be added to this request unlike customKeyValuePairs paramenter in the constructor which is added to every request
   */
  get (responseType = 'json', additionalHeaders = null, tempKeyValuePairs = []) {
    this.responseType = responseType
    this.tempKeyValuePairs = tempKeyValuePairs
    return this.makeApiCall('get', `${this.endpoint}${this.createQueryParamaters('get')}`)
  }

  /// //////////////////////////////////////////////////////////////////////////////////
  // endpoint setters
  /// /////////////////////////////////////////////////////////////////////////////////

  /**
   * adds an additional endpoint on the apiRoot path
   * @param
   * endpoint String with the desired endpoint
   */
  
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
   * @param Array of Strings or Objects with Propertyname to filter, property value and operator defaults to eq
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
    var builtQuery = buildQuery(query) + this.createCustomKeyValuePairs(this.customKeyValuePairs) + this.createCustomKeyValuePairs(this.tempKeyValuePairs)
    if (this.replaceParameterKeyWith) {
      this.replaceParameterKeyWith.forEach(parameter => {
        builtQuery = _.replace(builtQuery, `${parameter.parameterToReplace}`, `${parameter.replacement}`)
      })
    }
    return builtQuery
  }

  createHeaders (additionalHeaders) {
    this.headers = {}
    if (this.token) { this.headers.Authorization = `Bearer ${this.token}` }
    if (additionalHeaders) {
      Object.entries(additionalHeaders).forEach(([key, value]) => {
        this.headers[key] = value
      })
    }
    return this.headers
  }

  createCustomKeyValuePairs (keyValuePairs) {
    var additionalParameters = ''
    if (keyValuePairs.length) {
      keyValuePairs.forEach(pair => {
        additionalParameters += `&${pair.keyName}=${pair.keyValue}`
      })
    }
    return additionalParameters
  }
}