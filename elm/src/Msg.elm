module Msg exposing (Msg(..))

import Url
import Browser
import Material

type Msg
    = NoOp
    | Mdc (Material.Msg Msg)

    | LinkClicked Browser.UrlRequest
    | UrlChanged Url.Url
