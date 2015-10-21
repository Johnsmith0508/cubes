define fooo  "GET '/'", ->
  it "should have no blog if no one was registered", ->
    zombie.visit 'http://localhost:3000', (err, browser, status) ->
      expect(browser.text 'title').toEqual 'My Title'
      asyncSpecDone()
    asyncSpecWait()
