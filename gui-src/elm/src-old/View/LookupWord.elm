module View.LookupWord exposing (view)

import Html exposing (Html, text)
import Model exposing (Model)
import Msg exposing (Msg(..))
import RemoteData exposing (WebData)
import Types exposing (..)
import View.SearchDictionary exposing (viewSelectedResultRow)


view : Model -> Html Msg
view model =
    let
        s =
            model.lookupState
    in
    case s.currentWord of
        RemoteData.Success word_list ->
            case List.head word_list of
                Just word ->
                    viewSelectedResultRow word model

                Nothing ->
                    Html.div [] [ text "No current lookup word." ]

        _ ->
            Html.div [] [ text "No current lookup word." ]
