module Main exposing (main)

import Browser
import Model exposing (Model)
import Msg exposing (Msg(..))
import Subscriptions
import Update
import View


main =
    Browser.application
        { init = Model.init
        , view = View.view
        , update = Update.update
        , subscriptions = Subscriptions.subscriptions
        , onUrlChange = UrlChanged
        , onUrlRequest = LinkClicked
        }
