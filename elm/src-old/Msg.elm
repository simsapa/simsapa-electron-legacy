module Msg exposing (Msg(..))

import Url
import Browser
import Browser.Navigation as Nav
import Material
import Types exposing (..)
import RemoteData exposing (WebData)
import Route exposing (Route)

type Msg
    = NoOp
    | Mdc (Material.Msg Msg)

    | LinkClicked Browser.UrlRequest
    | UrlChanged Url.Url

    | NavigateTo Url.Url
    | NewUrl Route (Maybe String)
    | FocusInput String

    | FetchLookupWord String
    | LookupWordDataReceived (WebData (List DictWord))

    | SetDictLookupQuery String
    | DictLookupDataReceived (WebData (List DictWord))
    | AddToSelectedResults DictWord
    | RemoveFromSelectedResults DictWord

    | AddToSelectedTexts SelectedText

    | SetTextLookupQuery String
    | TextQueryDataReceived (WebData TextQueryData)

    | SetSelectedReadText SelectedText

    | AddToDictInput String
